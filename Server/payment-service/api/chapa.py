import requests
import os
from django.conf import settings
from django.urls import reverse_lazy
import logging

logger = logging.getLogger(__name__)


def get_base_url(request):
    scheme = request.is_secure() and "https" or "http"
    host = request.get_host()
    return f"{scheme}://{host}"


class ChapaMixin:
    """
    Distributed Systems Helper for External Payment Gateway
    """

    def initialize_transaction(
        self, email, amount, tx_ref, first_name, last_name, return_url, customization
    ):
        url = os.getenv("CHAPA_API_URL")

        # 1. Validation check
        if not settings.CHAPA_SECRET_KEY:
            return {"status": "failed", "message": "Secret Key missing in Pod configuration"}

        # 2. Construct Payload (All amounts must be strings for Chapa)
        payload = {
            "amount": str(amount),
            "currency": "ETB",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "tx_ref": tx_ref,
            # "callback_url": "https://webhook.site/dummy",  # Replace with your real webhook URL later
            "callback_url": "https://organic-space-barnacle-567p67qjw6wf7pgj-9000.app.github.dev" + reverse_lazy("chapa-webhook"),
            "return_url": return_url,
            "customization": customization,
        }
        print(payload["callback_url"])

        # 3. CONSTRUCT HEADERS (The 401 Fix)
        headers = {
            "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        try:
            logger.info(
                f"🌐 Initiating external handshake with Chapa for ref: {tx_ref}"
            )
            response = requests.post(url, json=payload, headers=headers)

            # If 401 happens, this will catch the details
            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            logger.error(
                f"❌ Chapa API Error: {e.response.status_code} - {e.response.text}"
            )
            return {
                "status": "failed",
                "message": f"External API Error: {e.response.status_code}",
            }
        except Exception as e:
            logger.exception("❌ Connection Failure to Payment Gateway")
            return {"status": "failed", "message": str(e)}
