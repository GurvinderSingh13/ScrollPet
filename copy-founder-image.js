const fs = require('fs');
const src = String.raw`C:\Users\Admin\.gemini\antigravity\brain\46d2f1ff-a8f8-486e-9983-0a5941ae7d3c\media__1774816350462.jpg`;
const dest = String.raw`d:\Gurvinder singh\Work\Gurvinder Singh\PetShat\Scrollpet\Scrollpet\ScrollPet\attached_assets\founder_gurvinder.jpg`;
fs.copyFileSync(src, dest);
console.log('Done! Image copied to:', dest);
