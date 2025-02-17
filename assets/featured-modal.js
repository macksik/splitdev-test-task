if (!customElements.get('featured-modal')) {
  class FeaturedModal extends HTMLElement {
    constructor() {
      super();
      this.productForm = this.querySelector('product-form');
      if (this.productForm) {
        this.setupFormListeners();
      }
    }

    setupFormListeners() {
      document.addEventListener('cart:update', () => {
        this.close();
      });
    }

    connectedCallback() {
      const overlay = this.querySelector('.modal-overlay');
      const closeButton = this.querySelector('.modal__close');

      if (this.shouldShowModal()) {
        if (closeButton) {
          closeButton.addEventListener('click', () => this.close());
        }

        if (overlay) {
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              this.close();
            }
          });
        }
      }
    }

    shouldShowModal() {
      const showOnce = this.hasAttribute('data-show-once');
      if (!showOnce) return true;

      const modalShown = sessionStorage.getItem('modalShown');
      return !modalShown;
    }

    open() {
      const overlay = this.querySelector('.modal-overlay');
      if (overlay && this.shouldShowModal()) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (this.hasAttribute('data-show-once')) {
          sessionStorage.setItem('modalShown', 'true');
        }
      }
    }

    close() {
      const overlay = this.querySelector('.modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }

  customElements.define('featured-modal', FeaturedModal);
}
