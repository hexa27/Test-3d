// Inisialisasi variabel global
let video, canvas, scene, camera, renderer, particles, handposeModel;
let isFist = false, isOpenPalm = false, isPeace = false, isThreeFingers = false;
let wristRotation = 0;

// Fungsi untuk membuat partikel 3D
function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const numParticles = 1000;

    for (let i = 0; i < numParticles; i++) {
        positions.push((Math.random() - 0.5) * 10);
        positions.push((Math.random() - 0.5) * 10);
        positions.push((Math.random() - 0.5) * 10);
        colors.push(Math.random(), Math.random(), Math.random());
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Fungsi untuk membuat bentuk Saturnus (cincin dan bola)
function createSaturnus() {
    // Sederhana: bola dengan cincin
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const ringGeometry = new THREE.RingGeometry(1.5, 2, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffa500 });
    const sphere = new THREE.Mesh(sphereGeometry, material);
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.rotation.x = Math.PI / 2;
    particles.add(sphere);
    particles.add(ring);
}

// Fungsi untuk membuat bentuk hati (sederhana menggunakan partikel)
function createHeart() {
    // Sederhana: atur posisi partikel membentuk hati
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1];
        // Formula hati sederhana
        positions[i] = x * (1 - Math.abs(y) / 2);
        positions[i + 1] = y;
    }
    particles.geometry.attributes.position.needsUpdate = true;
}

// Fungsi untuk mendeteksi pose tangan
function detectPose(predictions) {
    if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        // Deteksi fist (genggam): jari-jari dekat
        isFist = landmarks[8][1] > landmarks[5][1] && landmarks[12][1] > landmarks[9][1]; // Sederhana
        // Deteksi open palm (hi five): jari-jari terbuka
        isOpenPalm = landmarks[8][1] < landmarks[5][1] && landmarks[12][1] < landmarks[9][1];
        // Deteksi peace (2 jari): jari telunjuk dan tengah terbuka
        isPeace = landmarks[8][1] < landmarks[5][1] && landmarks[12][1] > landmarks[9][1];
        // Deteksi three fingers: telunjuk, tengah, manis terbuka
        isThreeFingers = landmarks[8][1] < landmarks[5][1] && landmarks[12][1] < landmarks[9][1] && landmarks[16][1] < landmarks[13][1];
        // Rotasi pergelangan (wrist)
        wristRotation = Math.atan2(landmarks[0][1] - landmarks[9][1], landmarks[0][0] - landmarks[9][0]);
    } else {
        isFist = isOpenPalm = isPeace = isThreeFingers = false;
    }
}

// Fungsi utama untuk update partikel berdasarkan pose
function updateParticles() {
    if (isFist) {
        // Menyatu: kumpulkan partikel ke pusat
        particles.position.set(0, 0, 0);
    } else if (isOpenPalm) {
        // Berpisah: sebar partikel
        particles.position.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
    } else if (isPeace) {
        // Bentuk Saturnus
        createSaturnus();
    } else if (isThreeFingers) {
        // Bentuk hati
        createHeart();
    }
    // Rotasi mengikuti pergelangan
    particles.rotation.y = wristRotation;
}

// Fungsi animasi loop
function animate() {
    requestAnimationFrame(animate);
    if (handposeModel) {
        handposeModel.estimateHands(video).then(detectPose);
    }
    updateParticles();
    renderer.render(scene, camera);
}

// Inisialisasi
async function init() {
    // Akses kamera
    video = document.getElementById('video');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
    });

    // Setup Three.js
    canvas = document.getElementById('canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Buat partikel
    createParticles();

    // Load handpose model
    handposeModel = await handpose.load();

    // Mulai animasi
    animate();
}

// Jalankan saat halaman load
window.onload = init;