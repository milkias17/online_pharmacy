import json
import os
from confluent_kafka import Consumer, Producer

# Setup
BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka-service:9092')
p = Producer({'bootstrap.servers': BOOTSTRAP_SERVERS})

def start_payment_consumer():
    c = Consumer({
        'bootstrap.servers': BOOTSTRAP_SERVERS,
        'group.id': 'payment-group',
        'auto.offset.reset': 'earliest'
    })
    c.subscribe(['inventory_events'])

    print(f"📡 Payment Service: Listening for Inventory Events on {BOOTSTRAP_SERVERS}...")

    try:
        while True:
            msg = c.poll(1.0)
            if msg is None: continue
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue

            data = json.loads(msg.value().decode('utf-8'))
            print(f"📦 Received: {data}")

            if data.get('event') == 'STOCK_RESERVED':
                order_id = data.get('order_id')
                print(f"💰 Processing Payment for Order: {order_id}...")
                
                # Simulate Payment Success
                response = {
                    "event": "PAYMENT_SUCCESS",
                    "order_id": order_id,
                    "user_id": data.get('user_id', '1')
                }
                p.produce('payment_events', json.dumps(response))
                p.flush()
                print(f"✅ Payment Success published to Kafka!")

    except KeyboardInterrupt:
        pass
    finally:
        c.close()

if __name__ == "__main__":
    start_payment_consumer()
