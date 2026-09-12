(function () {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cloud = document.createElement('div');
  cloud.id = 'cloud-cursor';
  cloud.innerHTML = `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 62c-11 0-19-8-19-18 0-9 6.5-16.5 15.3-17.8C23.8 15 33 8 45 8c10 0 18.5 6 21.6 14.4C77 22 86 30 86 41c0 .7 0 1.4-.1 2C93 45 98 51 98 58c0 8-7 12-15 12H25z"
        fill="#ffffff" stroke="#dfe1fb" stroke-width="1.5"/>
    </svg>`;
  document.body.appendChild(cloud);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cloudX = mouseX;
  let cloudY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    cloudX += (mouseX - cloudX) * 0.09;
    cloudY += (mouseY - cloudY) * 0.09;
    cloud.style.transform = `translate(${cloudX}px, ${cloudY - 46}px) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
