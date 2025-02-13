from gmail_utils import create_service
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging
from logging import Logger


API_NAME = os.getenv("GOOGLE_GMAIL_API_NAME")
API_VERSION = os.getenv("GOOGLE_GMAIL_API_VERSION")
SCOPES = [os.getenv("GOOGLE_GMAIL_SCOPES")]


class EmailSender():
    def __init__(self):
        self.__email_service = create_service(API_NAME, API_VERSION, SCOPES)

    def send_email(self, receipient : str,    email_message:str=None, subject_line:str=None) -> bool:
        mimeMessage = MIMEMultipart()
        mimeMessage['to'] = receipient
        mimeMessage['subject'] = subject_line
        mimeMessage.attach(MIMEText(email_message,  'plain'))
        raw_string = base64.urlsafe_b64encode   (mimeMessage.as_bytes()).decode()

        message = self.__email_service.users().messages().send(userId='me', body={'raw': raw_string}).execute()

        if not message:
            return False

        return True
    
email_sender : EmailSender = EmailSender()
