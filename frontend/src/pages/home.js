import hero from '../assets/campus-watercolor.png';
import { CATEGORIES } from '../services/directory.js';
import { categoryClass, icon } from '../components/ui.js';

export function homePage() {
  return `<section class="hero">
    <img class="hero-art" src="${hero}" alt="Watercolor of a sunlit campus quad, with Gothic college buildings and students gathering on the lawn" fetchpriority="high" />
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
