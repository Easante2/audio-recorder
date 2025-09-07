<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$config = require 'config/php/config.php';
$apiKey = $config['MAIL_API_KEY'];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if (!empty($_FILES["audioFile"])) {
        $audio = $_FILES["audioFile"];
        $fromEmail = "qassandra@quadrithm.co.uk";
        if ($audio["error"] === UPLOAD_ERR_OK) {
            // Proceed with email sending
        } else {
            echo "File upload error!";
        }
    } else {
        echo "No file uploaded!";
    }
    
    $name = $_POST['name'] ?? 'No Name';
    $clientEmail = $_POST['email'] ?? 'No Email';
    let arrEmail = ["Here is a new recorded audio from" . $name", "Their Email address is:" . $clientEmail"];

    if ($clientEmail && $audio) {
        $mail = new PHPMailer(true);

        try {
            // SMTP settings for Brevo (SendinBlue)
            $mail->isSMTP();
            $mail->Host = 'smtp-relay.brevo.com';
            $mail->SMTPAuth = true;
            $mail->Username = '8019ab00111111111@smtp-brevo.com';
            $mail->Password = $apiKey;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Email settings
            $mail->setFrom($fromEmail, 'Qassandra');
            $mail->addAddress($fromEmail);

            // Attach audio file
            $mail->addAttachment($audio['tmp_name'], $audio['name']);
            $mail->isHTML(true);
            $mail->Subject = 'New Recorded Audio';
            $mail->Body = "Here is a new recorded audio from"" . $name . "Their Email address is:" . $clientEmail";
            $mail->send();

            echo "Email sent successfully!";
        } catch (Exception $e) {
            echo "Email could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    } else {
        echo "Please enter your name and email adrress";
    }
} else {
    echo "Invalid request method!";
}
?>
