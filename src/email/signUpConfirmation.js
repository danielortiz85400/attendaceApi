import nodemailer from 'nodemailer'
import { nodeMailer } from '../configEnv.js'

export const sendEmail = async (token, email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: nodeMailer.email,
        pass: nodeMailer.password
      }
    })

    const emailOptions = {
      from: 'Support',
      to: email,
      subject: 'Support.app: Activar cuenta',
      html: `<div style="text-align:center">
                <img src="https://i.postimg.cc/ZYFmhmDR/support-App-confirmacion.jpg" style="border-radius:16px;">

                <h2> <a href='http://localhost:4000/api/signUp/verify?verify=${token}&email=${email}'>Activar </a> </h2>
   
              </div>
            `
    }
    await transporter.sendMail(emailOptions)
    console.log('El correo se envío correctamente')
  } catch (error) {
    console.log('El correo falló en el envío', error)
  }
}
