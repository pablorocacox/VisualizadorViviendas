import json
import os
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'processed_properties.json')

def process_properties():
    properties = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(DATA_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'elementList' in data:
                    for prop in data['elementList']:
                        # Extraer campos importantes
                        processed_prop = {
                            'propertyCode': prop.get('propertyCode'),
                            'price': prop.get('price'),
                            'size': prop.get('size'),
                            'rooms': prop.get('rooms'),
                            'bathrooms': prop.get('bathrooms'),
                            'propertyType': prop.get('propertyType'),
                            'operation': prop.get('operation'),
                            'municipality': prop.get('municipality'),
                            'district': prop.get('district'),
                            'neighborhood': prop.get('neighborhood'),
                            'address': prop.get('address'),
                            'latitude': prop.get('latitude'),
                            'longitude': prop.get('longitude'),
                            'url': prop.get('url'),
                            'description': prop.get('description'),
                            'hasLift': prop.get('hasLift'),
                            'exterior': prop.get('exterior'),
                            'priceByArea': prop.get('priceByArea'),
                            'thumbnail': prop.get('thumbnail'),
                            'hasSwimmingPool': prop.get('features', {}).get('hasSwimmingPool'),
                            'hasTerrace': prop.get('features', {}).get('hasTerrace'),
                            'hasAirConditioning': prop.get('features', {}).get('hasAirConditioning'),
                            'hasGarden': prop.get('features', {}).get('hasGarden'),
                            'parking': prop.get('parkingSpace', {}).get('hasParkingSpace') if 'parkingSpace' in prop else None,
                            'contactInfo': prop.get('contactInfo')
                        }
                        # Filtrar solo propiedades con coordenadas
                        if processed_prop['latitude'] and processed_prop['longitude']:
                            properties.append(processed_prop)
    
    # Guardar en JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(properties, f, ensure_ascii=False, indent=2)
    
    print(f"Procesadas {len(properties)} propiedades.")

if __name__ == '__main__':
    process_properties()