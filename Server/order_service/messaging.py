import os
import json
import logging
from confluent_kafka import Producer, Consumer

logger = logging.getLogger(__name__)

# --- PRODUCER SETUP ---
KAFKA_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka-service:9092')
p = Producer({'bootstrap.servers': KAFKA_SERVERS})

def publish_order_created(order_data):
    """
    Publishes the order details to the Kafka bus.
    """
    try:
        # We ensure medicine_id and quantity are included for the Java service
        payload = json.dumps(order_data)
        p.produce('order_events', payload)
        
        # CRITICAL: Force the message out of the buffer and into the network
        p.flush(timeout=10) 
        print(f"📡 Kafka: Order event pushed to 'order_events' topic.")
    except Exception as e:
        logger.error(f"❌ Kafka Publish Failed: {str(e)}")

# --- CONSUMER LOGIC ---
def start_order_consumer():
    """
    Background worker to listen for payment results.
    """
    c = Consumer({
        'bootstrap.servers': KAFKA_SERVERS,
        'group.id': 'order-group',
        'auto.offset.reset': 'earliest'
    })
    c.subscribe(['payment_events'])
    
    print(f"👂 Order Service: Listening for Payment results on {KAFKA_SERVERS}...")
    
    try:
        while True:
            msg = c.poll(1.0)
            if msg is None: continue
            if msg.error(): continue

            data = json.loads(msg.value().decode('utf-8'))
            if data.get('event') == 'PAYMENT_SUCCESS':
                from .models import Order # Deferred import to avoid circular error
                order_id = data.get('order_id')
                Order.objects.filter(id=order_id).update(status='CONFIRMED')
                print(f"✅ Order {order_id} moved to CONFIRMED status via Kafka.")
    finally:
        c.close()
