"use server"

import { db } from "@/lib/db"
import { v4 as uuid } from "uuid"
import crypto from "crypto"

import { getPasswordResetTokenByEmail } from "@/data/password-reset-token"
import { getVerificationTokenByEmail } from "@/data/verification-token"
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token"

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString()

  const expires = new Date(new Date().getTime() + 900 * 1000) //15 minutes

  const existingToken = await getTwoFactorTokenByEmail(email)

  if (existingToken) {
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      email,
      token,
      expires
    }
  })

  return twoFactorToken
}

export const generatePasswordResetToken = async (email: string) => {
  const token = uuid()
  const expires = new Date(new Date().getTime() + 900 * 1000) //15 minutes

  const existingToken = await getPasswordResetTokenByEmail(email)

  if (existingToken) {
    await db.passwordResetToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  })

  return passwordResetToken
}

export const generateVerificationToken = async (
  email: string,
  oldemail?: string
) => {
  const token = uuid()
  const expires = new Date(new Date().getTime() + 900 * 1000) //15 minutes

  const existingToken = await getVerificationTokenByEmail(email)

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  if (oldemail) {
    const verificationToken = await db.verificationToken.create({
      data: {
        email,
        token,
        expires,
        oldemail
      }
    })

    return verificationToken
  }

  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  })

  return verificationToken
}
