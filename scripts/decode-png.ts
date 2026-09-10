import { inflateSync } from "node:zlib";

export type DecodedPng = {
  height: number;
  pixels: Buffer;
  width: number;
};

const PNG_SIGNATURE = "89504e470d0a1a0a";
const RGB_COLOR_TYPE = 2;
const RGBA_COLOR_TYPE = 6;

const paethPredictor = (left: number, above: number, upperLeft: number) => {
  const estimate = left + above - upperLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceAbove = Math.abs(estimate - above);
  const distanceUpperLeft = Math.abs(estimate - upperLeft);

  if (distanceLeft <= distanceAbove && distanceLeft <= distanceUpperLeft) {
    return left;
  }

  return distanceAbove <= distanceUpperLeft ? above : upperLeft;
};

const readChunks = (file: Buffer) => {
  const parts: Buffer[] = [];
  let offset = 8;

  while (offset + 8 <= file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.subarray(offset + 4, offset + 8).toString("ascii");

    if (type === "IDAT") {
      parts.push(file.subarray(offset + 8, offset + 8 + length));
    }
    if (type === "IEND") {
      break;
    }

    offset += 12 + length;
  }

  return Buffer.concat(parts);
};

const unfilter = (raw: Buffer, width: number, height: number, channels: number) => {
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);

  for (let row = 0; row < height; row += 1) {
    const filterType = raw[row * (stride + 1)];
    const start = row * (stride + 1) + 1;

    for (let index = 0; index < stride; index += 1) {
      const left = index >= channels ? pixels[row * stride + index - channels] : 0;
      const above = row > 0 ? pixels[(row - 1) * stride + index] : 0;
      const upperLeft =
        index >= channels && row > 0
          ? pixels[(row - 1) * stride + index - channels]
          : 0;
      const value = raw[start + index];

      if (filterType === 0) {
        pixels[row * stride + index] = value;
      } else if (filterType === 1) {
        pixels[row * stride + index] = (value + left) & 0xff;
      } else if (filterType === 2) {
        pixels[row * stride + index] = (value + above) & 0xff;
      } else if (filterType === 3) {
        pixels[row * stride + index] = (value + ((left + above) >> 1)) & 0xff;
      } else if (filterType === 4) {
        pixels[row * stride + index] =
          (value + paethPredictor(left, above, upperLeft)) & 0xff;
      } else {
        throw new Error(`Filtro PNG no soportado: ${filterType} en la fila ${row}`);
      }
    }
  }

  return pixels;
};

const toRgba = (pixels: Buffer, width: number, height: number, channels: number) => {
  if (channels === 4) {
    return pixels;
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    rgba[index * 4] = pixels[index * 3];
    rgba[index * 4 + 1] = pixels[index * 3 + 1];
    rgba[index * 4 + 2] = pixels[index * 3 + 2];
    rgba[index * 4 + 3] = 255;
  }

  return rgba;
};

export const decodePng = (file: Buffer): DecodedPng => {
  if (file.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error("El archivo no es un PNG valido");
  }

  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  const bitDepth = file[24];
  const colorType = file[25];
  const interlace = file[28];

  if (bitDepth !== 8) {
    throw new Error(`Solo se soporta bitDepth 8, se recibio ${bitDepth}`);
  }
  if (colorType !== RGB_COLOR_TYPE && colorType !== RGBA_COLOR_TYPE) {
    throw new Error(`Solo se soportan PNG RGB o RGBA, colorType ${colorType}`);
  }
  if (interlace !== 0) {
    throw new Error("Los PNG entrelazados no estan soportados");
  }

  const channels = colorType === RGBA_COLOR_TYPE ? 4 : 3;
  const raw = inflateSync(readChunks(file));
  const expected = (width * channels + 1) * height;

  if (raw.length !== expected) {
    throw new Error(`Datos PNG incompletos: ${raw.length} de ${expected} bytes`);
  }

  return {
    height,
    pixels: toRgba(unfilter(raw, width, height, channels), width, height, channels),
    width,
  };
};

export const scalePng = (source: DecodedPng, targetWidth: number): DecodedPng => {
  if (targetWidth >= source.width) {
    return source;
  }

  const height = Math.max(1, Math.round((source.height * targetWidth) / source.width));
  const pixels = Buffer.alloc(targetWidth * height * 4);

  for (let row = 0; row < height; row += 1) {
    const rowStart = Math.floor((row * source.height) / height);
    const rowEnd = Math.max(rowStart + 1, Math.floor(((row + 1) * source.height) / height));

    for (let column = 0; column < targetWidth; column += 1) {
      const columnStart = Math.floor((column * source.width) / targetWidth);
      const columnEnd = Math.max(
        columnStart + 1,
        Math.floor(((column + 1) * source.width) / targetWidth)
      );
      const totals = [0, 0, 0, 0];
      let samples = 0;

      for (let sourceRow = rowStart; sourceRow < rowEnd; sourceRow += 1) {
        for (let sourceColumn = columnStart; sourceColumn < columnEnd; sourceColumn += 1) {
          const offset = (sourceRow * source.width + sourceColumn) * 4;
          for (let channel = 0; channel < 4; channel += 1) {
            totals[channel] += source.pixels[offset + channel];
          }
          samples += 1;
        }
      }

      for (let channel = 0; channel < 4; channel += 1) {
        pixels[(row * targetWidth + column) * 4 + channel] = Math.round(
          totals[channel] / samples
        );
      }
    }
  }

  return { height, pixels, width: targetWidth };
};

export const flattenOnWhite = (source: DecodedPng) => {
  const rgb = Buffer.alloc(source.width * source.height * 3);

  for (let index = 0; index < source.width * source.height; index += 1) {
    const alpha = source.pixels[index * 4 + 3] / 255;
    for (let channel = 0; channel < 3; channel += 1) {
      rgb[index * 3 + channel] = Math.round(
        source.pixels[index * 4 + channel] * alpha + 255 * (1 - alpha)
      );
    }
  }

  return rgb;
};
