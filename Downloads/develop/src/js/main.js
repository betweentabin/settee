import anime from 'animejs';
import './news.js';

// メイン処理
document.addEventListener('DOMContentLoaded', () => {
  console.log('Telepathy Vite Template が読み込まれました');
  
  // アニメーションのサンプル
  anime({
    targets: '.animate-element',
    translateX: 250,
    rotate: '1turn',
    backgroundColor: '#FFF',
    duration: 800,
    easing: 'easeInOutQuad'
  });
}); 