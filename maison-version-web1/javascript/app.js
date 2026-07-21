import {client} from './sanityClient.js'

// ==================== DATOS INICIALES ====================
let products = []
let categories = []
let siteContent = {
    heroEyebrow: 'Colección',
    heroDescription: 'Piezas de madera pintadas a mano que transforman espacios en experiencias únicas.',
    aboutTitle: 'Nuestra esencia',
    aboutText: 'Trabajamos con maderas seleccionadas y técnicas de pintura a mano que garantizan piezas únicas, irrepetibles y llenas de personalidad.',
    contactAddress: 'Calle del Arte, 123<br>Ciudad Creativa',
    contactPhone: '+34 123 456 789',
    contactEmail: 'info@maizonconcept.com',
    socialInstagram: '#',
    socialFacebook: '#',
}

let siteSettings = {
    theme: 'neutral',
    cardBorder: 'rounded',
    cardShadow: 'subtle',
    animationSpeed: 'normal',
}

let currentFilter = 'all'

// ==================== FETCH CMS DATA ====================
async function fetchCMSData() {
    try {
        const productsQuery = `*[_type == 'producto'] {
            _id,
            name,
            description,
            price,
            featured,
            image,
            colors,
            category->{_id, name, slug}
        }`
        products = await client.fetch(productsQuery)

        const categoriesQuery = `*[_type == 'category'] | order(order asc) {_id, name, slug}`
        categories = await client.fetch(categoriesQuery)

        const settingsQuery = `*[_id == 'siteSettings'][0] {
            siteName, contactEmail, phoneNumber, address, socialMedia
        }`
        const settings = await client.fetch(settingsQuery)
        if (settings) {
            if (settings.contactEmail) siteContent.contactEmail = settings.contactEmail
            if (settings.phoneNumber) siteContent.contactPhone = settings.phoneNumber
            if (settings.address) siteContent.contactAddress = settings.address
            if (settings.socialMedia) {
                if (settings.socialMedia.instagram) siteContent.socialInstagram = settings.socialMedia.instagram
                if (settings.socialMedia.facebook) siteContent.socialFacebook = settings.socialMedia.facebook
            }
        }

        const homeQuery = `*[_id == 'home'][0] {heroTitle, heroSubtitle, aboutPreview, ctaText}`
        const home = await client.fetch(homeQuery)
        if (home) {
            if (home.heroTitle) siteContent.heroEyebrow = home.heroTitle
            if (home.heroSubtitle) siteContent.heroDescription = home.heroSubtitle
            if (home.aboutPreview) siteContent.aboutText = home.aboutPreview
        }

        console.log('✅ Datos cargados desde Sanity CMS')
    } catch (error) {
        console.error('❌ Error cargando datos de Sanity:', error)
    }
}

// ==================== CARRUSEL ====================
let currentSlide = 0
let autoplayInterval
let featuredProducts = []

function getFeaturedProducts() {
    return products.filter(p => p.featured === 'true')
}

function initCarousel() {
    featuredProducts = getFeaturedProducts()
    if (featuredProducts.length === 0) {
        document.getElementById('carouselTrack').innerHTML = `
            <div class="carousel-slide active">
                <div class="carousel-slide-image">
                    <div class="image-placeholder">
                        <i class="fas fa-star"></i>
                        <span>Próximamente piezas destacadas</span>
                    </div>
                </div>
                <div class="carousel-slide-info">
                    <span class="carousel-slide-badge">Destacado</span>
                    <h3>Nuevas piezas pronto</h3>
                    <p class="description">Estamos preparando nuestra colección de piezas destacadas. Vuelve pronto para descubrirlas.</p>
                </div>
            </div>
        `
        document.getElementById('carouselIndicators').innerHTML = ''
        document.getElementById('carouselCounter').textContent = ''
        return
    }

    renderCarouselSlides()
    renderCarouselIndicators()
    updateCarousel()
    startAutoplay()

    const wrapper = document.querySelector('.carousel-wrapper')
    wrapper.addEventListener('mouseenter', stopAutoplay)
    wrapper.addEventListener('mouseleave', startAutoplay)

    let touchStartX = 0
    let touchEndX = 0
    wrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX
        stopAutoplay()
    })
    wrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX
        if (touchStartX - touchEndX > 50) nextSlide()
        if (touchEndX - touchStartX > 50) prevSlide()
        startAutoplay()
    })
}

function renderCarouselSlides() {
    const track = document.getElementById('carouselTrack')
    track.innerHTML = featuredProducts.map((product, index) => {
        const colorMap = { blanco: '#f5f0eb', negro: '#2d2d2d', madera: '#c4a882', personalizado: 'linear-gradient(135deg, #f5f0eb, #c4a882, #2d2d2d)' }
        const categoryName = product.category ? product.category.name : 'Sin categoría'
        const imageUrl = product.image ? (product.image.url || product.image) : null
        return `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                <div class="carousel-slide-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas fa-paint-brush\\'></i><span>Sin imagen</span></div>'">` : `
                    <div class="image-placeholder">
                        <i class="fas fa-paint-brush"></i>
                        <span>${categoryName}</span>
                    </div>`}
                </div>
                <div class="carousel-slide-info">
                    <span class="carousel-slide-badge">Destacado</span>
                    <h3>${product.name}</h3>
                    <p class="description">${product.description || ''}</p>
                    <div class="carousel-colors">
                        ${product.colors ? product.colors.map(c => `<span class="carousel-color-dot" style="background: ${colorMap[c] || '#ccc'}" title="${c}"></span>`).join('') : ''}
                    </div>
                    <div class="carousel-slide-price">€${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    <a href="#contacto" class="btn-carousel-cta">
                        Consultar esta pieza
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `
    }).join('')
}

function renderCarouselIndicators() {
    const indicators = document.getElementById('carouselIndicators')
    indicators.innerHTML = featuredProducts.map((_, index) => `
        <button class="carousel-indicator ${index === 0 ? 'active' : ''}" 
                onclick="goToSlide(${index})" 
                aria-label="Ir a slide ${index + 1}">
        </button>
    `).join('')
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack')
    const slides = track.querySelectorAll('.carousel-slide')
    const indicators = document.querySelectorAll('.carousel-indicator')
    const counter = document.getElementById('carouselCounter')

    track.style.transform = `translateX(-${currentSlide * 100}%)`

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide)
    })

    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide)
    })

    if (counter && featuredProducts.length > 0) {
        counter.textContent = `${currentSlide + 1} / ${featuredProducts.length}`
    }
}

function nextSlide() {
    if (featuredProducts.length === 0) return
    currentSlide = (currentSlide + 1) % featuredProducts.length
    updateCarousel()
}

function prevSlide() {
    if (featuredProducts.length === 0) return
    currentSlide = (currentSlide - 1 + featuredProducts.length) % featuredProducts.length
    updateCarousel()
}

function goToSlide(index) {
    if (featuredProducts.length === 0) return
    currentSlide = index
    updateCarousel()
    resetAutoplay()
}

function startAutoplay() {
    stopAutoplay()
    autoplayInterval = setInterval(nextSlide, 5000)
}

function stopAutoplay() {
    clearInterval(autoplayInterval)
}

function resetAutoplay() {
    stopAutoplay()
    startAutoplay()
}

// ==================== INICIALIZACIÓN ====================
async function init() {
    applySettings()
    
    document.getElementById('catalogGrid').innerHTML = '<p>Cargando piezas desde el taller...</p>'
    
    await fetchCMSData() 
    
    loadContent()
    renderCatalog()
    initCarousel()
    setupNavigation()
    setupScrollListener()
    
    updateFilterPills()
}

function applySettings() {
    document.body.setAttribute('data-theme', siteSettings.theme)
    document.documentElement.style.setProperty('--transition-smooth',
        siteSettings.animationSpeed === 'slow' ? '0.6s cubic-bezier(0.4, 0, 0.2, 1)' :
        siteSettings.animationSpeed === 'fast' ? '0.2s cubic-bezier(0.4, 0, 0.2, 1)' :
        '0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    )
}

function loadContent() {
    document.getElementById('heroEyebrow').textContent = siteContent.heroEyebrow
    document.getElementById('heroDescription').textContent = siteContent.heroDescription
    document.getElementById('aboutTitle').textContent = siteContent.aboutTitle
    document.getElementById('aboutTextContent').textContent = siteContent.aboutText
    document.getElementById('contactAddress').innerHTML = siteContent.contactAddress
    document.getElementById('contactPhone').textContent = siteContent.contactPhone
    document.getElementById('contactEmail').textContent = siteContent.contactEmail
    document.getElementById('socialInstagram').href = siteContent.socialInstagram
    document.getElementById('socialFacebook').href = siteContent.socialFacebook
}

// ==================== NAVEGACIÓN ====================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-item[data-section]')
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            const target = document.getElementById(this.dataset.section)
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'))
            this.classList.add('active')
            document.getElementById('navLinks').classList.remove('active')
            document.getElementById('navToggle').classList.remove('active')
        })
    })
}

function toggleNav() {
    document.getElementById('navLinks').classList.toggle('active')
    document.getElementById('navToggle').classList.toggle('active')
}

function setupScrollListener() {
    const navbar = document.getElementById('navbar')
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled')
        } else {
            navbar.classList.remove('scrolled')
        }

        const sections = document.querySelectorAll('section[id]')
        const navLinks = document.querySelectorAll('.nav-item[data-section]')
        let current = ''
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id')
            }
        })
        navLinks.forEach(link => {
            link.classList.remove('active')
            if (link.dataset.section === current) {
                link.classList.add('active')
            }
        })
    })
}

// ==================== CATÁLOGO ====================
function renderCatalog(filter = 'all') {
    const grid = document.getElementById('catalogGrid')
    const empty = document.getElementById('catalogEmpty')
    
    let filteredProducts
    if (filter === 'all') {
        filteredProducts = products
    } else {
        filteredProducts = products.filter(p => p.category && p.category.slug === filter)
    }

    if (filteredProducts.length === 0) {
        grid.innerHTML = ''
        empty.style.display = 'block'
        return
    }

    empty.style.display = 'none'
    grid.innerHTML = filteredProducts.map((product, index) => {
        const categoryName = product.category ? product.category.name : 'Sin categoría'
        const categorySlug = product.category ? product.category.slug : 'all'
        const imageUrl = product.image ? (product.image.url || product.image) : null
        return `
            <div class="product-card-minimal" style="animation-delay: ${index * 0.1}s" data-category="${categorySlug}">
                <div class="product-card-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas fa-paint-brush\\'></i><span>Sin imagen</span></div>'">` : `
                    <div class="image-placeholder">
                        <i class="fas fa-paint-brush"></i>
                        <span>${categoryName}</span>
                    </div>`}
                    ${product.featured === 'true' ? '<span class="product-badge">Destacado</span>' : ''}
                </div>
                <div class="product-card-body">
                    <h3>${product.name}</h3>
                    <p class="description">${product.description || ''}</p>
                    <div class="product-meta">
                        <span class="product-price">€${product.price ? product.price.toFixed(2) : '0.00'}</span>
                        <div class="product-colors-mini">
                            ${product.colors ? product.colors.map(c => {
                                const colorMap = { blanco: '#f5f0eb', negro: '#2d2d2d', madera: '#c4a882', personalizado: 'linear-gradient(135deg, #f5f0eb, #c4a882, #2d2d2d)' }
                                return `<span class="color-dot-mini" style="background: ${colorMap[c] || '#ccc'}" title="${c}"></span>`
                            }).join('') : ''}
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('')

    const cards = grid.querySelectorAll('.product-card-minimal')
    cards.forEach(card => {
        card.style.opacity = '0'
        card.style.transform = 'translateY(30px)'
        requestAnimationFrame(() => {
            card.style.opacity = '1'
            card.style.transform = 'translateY(0)'
        })
    })
}

function updateFilterPills() {
    const filterContainer = document.querySelector('.filter-pills')
    if (!filterContainer) return
    
    let pillsHTML = '<button type="button" class="pill active" data-filter="all">Todas</button>'
    
    categories.forEach(cat => {
        pillsHTML += `<button type="button" class="pill" data-filter="${cat.slug}">${cat.name}</button>`
    })
    
    filterContainer.innerHTML = pillsHTML
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'))
        e.target.classList.add('active')
        currentFilter = e.target.dataset.filter
        renderCatalog(currentFilter)
    }
})

// ==================== FORMULARIOS PÚBLICOS ====================
function handleContactSubmit(e) {
    e.preventDefault()
    const btn = e.target.querySelector('.btn-send')
    btn.innerHTML = '<i class="fas fa-check"></i> ¡Enviado!'
    btn.style.background = '#4ADE80'
    setTimeout(() => {
        btn.innerHTML = 'Enviar mensaje <i class="fas fa-arrow-right"></i>'
        btn.style.background = ''
        e.target.reset()
    }, 3000)
}

function handleNewsletterSubmit(e) {
    e.preventDefault()
    const btn = e.target.querySelector('button')
    const icon = btn.querySelector('i')
    icon.className = 'fas fa-check'
    setTimeout(() => {
        icon.className = 'fas fa-arrow-right'
        e.target.reset()
    }, 2000)
}

// ==================== TECLAS FLECHA PARA CARRUSEL ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') prevSlide()
    if (e.key === 'ArrowRight') nextSlide()
})

// ==================== INICIAR ====================
init()

console.log('🌿 Maizon Concept · Carrusel de destacados activo')
console.log('🖱️  Usa las flechas del teclado o los botones para navegar')
console.log('📱  Soporte táctil para móviles')