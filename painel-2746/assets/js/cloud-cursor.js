(function () {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cloud = document.createElement('div');
  cloud.id = 'cloud-cursor';
  cloud.textContent = '☁️';
  cloud.setAttribute('aria-hidden', 'true');
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
