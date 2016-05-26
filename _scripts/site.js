var menuButtonElem = document.getElementById('nav-icon');
var menuElem = document.getElementById('nav-links');

menuButtonElem.addEventListener('click', () => {
  menuElem.style.display = menuElem.style.display === 'block' ? 'none' : 'block';
});