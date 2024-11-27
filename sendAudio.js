const express = require("express");
const multer = require("multer");
const { createTransport } = require("nodemailer");
const path = require("path");
const app = express();
const port = 3000;

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

const transporter = createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: "",
    pass: "",
  },
});

// Endpoint to handle audio uploads and send emails
app.post("/send-audio", upload.single("audioFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const mailOptions = {
    from: "",
    to: "",
    subject: "Recorded Audio",
    text: "Please find the attached audio file.",
    attachments: [
      {
        filename: req.file.originalname || "audio.mp4",
        path: path.resolve(req.file.path),
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).send("Error sending email.");
    } else {
      console.log("Email sent: " + info.response);
      return res.send("Email sent successfully!");
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
