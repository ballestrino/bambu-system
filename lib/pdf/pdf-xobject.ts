export type PdfImage = {
  height: number;
  hex: string;
  name: string;
  width: number;
};

// ASCIIHexDecode espera el terminador ">" al final del stream, lo que mantiene
// todo el PDF en ASCII y deja intactos los offsets del xref.
const buildImageStream = (image: PdfImage) => `${image.hex}>\n`;

export const buildImageObject = (image: PdfImage) => {
  const stream = buildImageStream(image);

  return [
    "<< /Type /XObject /Subtype /Image",
    `/Width ${image.width} /Height ${image.height}`,
    "/ColorSpace /DeviceRGB /BitsPerComponent 8",
    "/Filter [/ASCIIHexDecode /FlateDecode]",
    `/Length ${stream.length} >>\nstream\n${stream}endstream`,
  ].join(" ");
};

export const buildXObjectResource = (images: PdfImage[], startId: number) =>
  images.length
    ? ` /XObject << ${images
        .map((image, index) => `/${image.name} ${startId + index} 0 R`)
        .join(" ")} >>`
    : "";
