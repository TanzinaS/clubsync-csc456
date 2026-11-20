import hero from '../assets/campus-watercolor.png';
import heroAvif640 from '../assets/hero/campus-watercolor-640.avif';
import heroAvif1024 from '../assets/hero/campus-watercolor-1024.avif';
import heroAvif1536 from '../assets/hero/campus-watercolor-1536.avif';
import heroWebp640 from '../assets/hero/campus-watercolor-640.webp';
import heroWebp1024 from '../assets/hero/campus-watercolor-1024.webp';
import heroWebp1536 from '../assets/hero/campus-watercolor-1536.webp';
import { CATEGORIES } from '../services/directory.js';
import { categoryClass, icon } from '../components/ui.js';

// The hero covers the full screen (object-fit: cover, at least the viewport height), and the
// image is 3:2, so on portrait screens it is about 1.5 times the viewport height wide.
const HERO_SIZES = '(orientation: portrait) 150vh, 100vw';
const srcset = (...pairs) => pairs.map(([url, width]) => `${url} ${width}w`).join(', ');

export function homePage() {
  return `<section class="hero">
    <picture>
      <source type="image/avif" srcset="${srcset([heroAvif640, 640], [heroAvif1024, 1024], [heroAvif1536, 1536])}" sizes="${HERO_SIZES}">
      <source type="image/webp" srcset="${srcset([heroWebp640, 640], [heroWebp1024, 1024], [heroWebp1536, 1536])}" sizes="${HERO_SIZES}">
      <img class="hero-art" src="${hero}" width="1536" height="1024" alt="Watercolor of a sunlit campus quad, with Gothic college buildings and students gathering on the lawn" fetchpriority="high" />
    </picture>
    <div class="hero-wash"></div>
    <div class="hero-content">
      <p class="eyebrow">The City College of New York</p>
      <h1>Everything happening on campus,<br class="desktop-break"> in one place.</h1>
      <p class="hero-description">Events from CCNY clubs and campus orgs, workshops, games,<br class="desktop-break"> screenings, and gatherings. Never miss what's happening on campus.</p>
      <div class="hero-actions"><a class="button dark" href="#/events">Browse events ${icon('arrow')}</a><a class="button white" href="#/clubs">Find your club</a></div>
      <div class="hero-categories" aria-label="Browse events by category">${CATEGORIES.map(category => `<a class="category-pill ${categoryClass(category)}" href="#/events?category=${encodeURIComponent(category)}">${category}</a>`).join('')}</div>
    </div>
  </section>`;
}
