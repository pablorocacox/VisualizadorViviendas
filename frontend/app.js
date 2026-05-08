let map;
let markers = [];
let allProperties = [];
let filteredProperties = [];
const FULL_PRICE_ZOOM = 17;

const propertyTypeLabels = {
    flat: 'Piso',
    chalet: 'Chalet',
    studio: 'Estudio',
    duplex: 'Dúplex',
    penthouse: 'Ático',
    countryHouse: 'Casa rural'
};

const formatCurrency = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
});

document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupFilters();
    loadProperties();
});

function initMap() {
    map = L.map('map', {
        scrollWheelZoom: true,
        zoomControl: true
    }).setView([40.4168, -3.7038], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('zoomend', updateMarkerIcons);
}

async function loadProperties() {
    const list = document.getElementById('propertyList');
    list.innerHTML = createLoadingState();

    try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        allProperties = await response.json();
        filteredProperties = [...allProperties];
        populateMunicipalities();
        render();
    } catch (error) {
        console.error('Error loading properties:', error);
        list.innerHTML = createEmptyState('No se pudieron cargar los datos', 'Revisa que Flask esté sirviendo /api/properties correctamente.');
    }
}

function render() {
    updateMap();
    updateList();
    updateStats();
}

function updateMap() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    filteredProperties.forEach(prop => {
        if (prop.latitude && prop.longitude) {
            const marker = L.marker([prop.latitude, prop.longitude], {
                icon: createMarkerIcon(prop)
            })
                .addTo(map)
                .bindPopup(createPopupContent(prop));
            marker.propertyData = prop;
            markers.push(marker);
        }
    });

    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds(), { padding: [34, 34], maxZoom: 14 });
    }
}

function createMarkerIcon(prop) {
    const showFullPrice = map && map.getZoom() >= FULL_PRICE_ZOOM;
    const label = showFullPrice ? `<span>${escapeHtml(formatMarkerFullPrice(prop.price))}</span>` : '';
    const size = showFullPrice ? [92, 42] : [28, 38];
    const anchor = showFullPrice ? [46, 42] : [14, 38];

    return L.divIcon({
        className: '',
        html: `
            <div class="price-pin ${getPriceColorClass(prop.price)} ${showFullPrice ? 'is-full' : ''}">
                ${label}
            </div>
        `,
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: [0, -38]
    });
}

function updateMarkerIcons() {
    markers.forEach(marker => {
        marker.setIcon(createMarkerIcon(marker.propertyData));
    });
}

function createPopupContent(prop) {
    return `
        <div class="popup-card">
            <img src="${getThumbnail(prop)}" alt="${escapeHtml(getTitle(prop))}">
            <h3>${formatPrice(prop.price)}</h3>
            <p>${escapeHtml(formatPropertyFacts(prop))}</p>
            <p>${escapeHtml(prop.municipality || 'Municipio no disponible')}</p>
            <a href="${escapeAttribute(prop.url || '#')}" target="_blank" rel="noopener noreferrer">Ver en Idealista</a>
            ${getPhone(prop) ? `<p>Contacto: ${escapeHtml(getPhone(prop))}</p>` : ''}
        </div>
    `;
}

function updateList() {
    const list = document.getElementById('propertyList');
    list.innerHTML = '';

    if (filteredProperties.length === 0) {
        list.innerHTML = createEmptyState('No hay resultados', 'Prueba a ampliar precio, municipio o características.');
        return;
    }

    const fragment = document.createDocumentFragment();

    filteredProperties.forEach(prop => {
        const card = document.createElement('article');
        card.className = 'property-card';
        card.innerHTML = `
            <img src="${getThumbnail(prop)}" alt="${escapeHtml(getTitle(prop))}">
            <div class="property-info">
                <h3>${formatPrice(prop.price)}</h3>
                <div class="property-meta">
                    <span>${escapeHtml(formatPropertyFacts(prop))}</span>
                    ${prop.priceByArea ? `<span>${formatNumber(prop.priceByArea)} €/m²</span>` : ''}
                    ${prop.propertyType ? `<span>${escapeHtml(propertyTypeLabels[prop.propertyType] || prop.propertyType)}</span>` : ''}
                </div>
                <p class="property-location">${escapeHtml(prop.municipality || 'Municipio no disponible')}${prop.district ? ` · ${escapeHtml(prop.district)}` : ''}</p>
                <p class="property-address">${escapeHtml(prop.address || 'Dirección no disponible')}</p>
                <div class="property-actions">
                    <a href="${escapeAttribute(prop.url || '#')}" target="_blank" rel="noopener noreferrer">Abrir anuncio</a>
                    ${renderAmenities(prop)}
                </div>
            </div>
        `;
        fragment.appendChild(card);
    });

    list.appendChild(fragment);
}

function updateStats() {
    const total = filteredProperties.length;
    const avgPrice = total > 0 ? Math.round(filteredProperties.reduce((sum, p) => sum + (p.price || 0), 0) / total) : 0;
    const avgPriceAreaItems = filteredProperties.filter(p => p.priceByArea);
    const avgPriceArea = avgPriceAreaItems.length > 0
        ? Math.round(avgPriceAreaItems.reduce((sum, p) => sum + p.priceByArea, 0) / avgPriceAreaItems.length)
        : 0;

    document.getElementById('totalProperties').textContent = formatNumber(total);
    document.getElementById('avgPrice').textContent = total > 0 ? formatPrice(avgPrice) : '0 €';
    document.getElementById('avgPriceArea').textContent = `${formatNumber(avgPriceArea)} €/m²`;
    document.getElementById('resultSummary').textContent = `${formatNumber(total)} ${total === 1 ? 'resultado' : 'resultados'}`;
}

function populateMunicipalities() {
    const select = document.getElementById('municipality');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Todos los municipios</option>';

    const municipalities = [...new Set(allProperties.map(p => p.municipality).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'));

    municipalities.forEach(mun => {
        const option = document.createElement('option');
        option.value = mun;
        option.textContent = mun;
        select.appendChild(option);
    });

    select.value = currentValue;
}

function setupFilters() {
    const filters = ['minPrice', 'maxPrice', 'rooms', 'municipality', 'pool', 'terrace', 'lift', 'ac', 'parking'];
    filters.forEach(filter => {
        const element = document.getElementById(filter);
        element.addEventListener('input', applyFilters);
        element.addEventListener('change', applyFilters);
    });

    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

function applyFilters() {
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    const minRooms = parseInt(document.getElementById('rooms').value, 10) || 0;
    const municipality = document.getElementById('municipality').value;
    const hasPool = document.getElementById('pool').checked;
    const hasTerrace = document.getElementById('terrace').checked;
    const hasLift = document.getElementById('lift').checked;
    const hasAc = document.getElementById('ac').checked;
    const hasParking = document.getElementById('parking').checked;

    filteredProperties = allProperties.filter(prop => {
        return (prop.price || 0) >= minPrice &&
               (prop.price || 0) <= maxPrice &&
               (prop.rooms || 0) >= minRooms &&
               (!municipality || prop.municipality === municipality) &&
               (!hasPool || prop.hasSwimmingPool) &&
               (!hasTerrace || prop.hasTerrace) &&
               (!hasLift || prop.hasLift) &&
               (!hasAc || prop.hasAirConditioning) &&
               (!hasParking || prop.parking);
    });

    render();
}

function resetFilters() {
    ['minPrice', 'maxPrice', 'rooms', 'municipality'].forEach(id => {
        document.getElementById(id).value = '';
    });
    ['pool', 'terrace', 'lift', 'ac', 'parking'].forEach(id => {
        document.getElementById(id).checked = false;
    });
    applyFilters();
}

function renderAmenities(prop) {
    const amenities = [
        prop.hasSwimmingPool ? 'Piscina' : null,
        prop.hasTerrace ? 'Terraza' : null,
        prop.hasLift ? 'Ascensor' : null,
        prop.hasAirConditioning ? 'A/C' : null,
        prop.parking ? 'Parking' : null
    ].filter(Boolean);

    if (amenities.length === 0) {
        return prop.priceByArea ? `<span class="price-area">${formatNumber(prop.priceByArea)} €/m²</span>` : '';
    }

    return `<span class="amenity">${escapeHtml(amenities.slice(0, 2).join(' + '))}</span>`;
}

function formatPropertyFacts(prop) {
    const parts = [];
    if (prop.size) parts.push(`${formatNumber(prop.size)} m²`);
    parts.push(`${prop.rooms || 0} hab.`);
    if (prop.bathrooms) parts.push(`${prop.bathrooms} baños`);
    return parts.join(' · ');
}

function formatPrice(value) {
    return value ? formatCurrency.format(value) : 'Precio no disponible';
}

function formatMarkerFullPrice(value) {
    return value ? `${formatNumber(value)}€` : 'Sin precio';
}

function getPriceColorClass(price) {
    if (!price) return 'price-unknown';
    if (price < 150000) return 'price-low';
    if (price < 250000) return 'price-mid-low';
    if (price < 400000) return 'price-mid';
    if (price < 650000) return 'price-high';
    return 'price-premium';
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value || 0);
}

function getTitle(prop) {
    return `${formatPrice(prop.price)} en ${prop.municipality || 'propiedad'}`;
}

function getPhone(prop) {
    return prop.contactInfo?.phone1?.formattedPhone || '';
}

function getThumbnail(prop) {
    return prop.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"%3E%3Crect width="320" height="220" fill="%23e7e1d8"/%3E%3Cpath d="M74 148h172v-52l-86-48-86 48z" fill="%23cfc7bb"/%3E%3Cpath d="M105 148v-38h37v38zm65 0v-38h45v38z" fill="%23fbfaf7"/%3E%3C/svg%3E';
}

function createEmptyState(title, message) {
    return `
        <div class="empty-state">
            <div>
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}

function createLoadingState() {
    return `
        <div class="loading-state">
            <div>
                <strong>Cargando propiedades</strong>
                <span>Preparando mapa y listado...</span>
            </div>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
}
