if (!customElements.get('featured-modal')) {
  class FeaturedModal extends HTMLElement {
    constructor() {
      super();
      this.productForm = this.querySelector('product-form');
      this.overlay = this.querySelector('.modal-overlay');
      this.closeButton = this.querySelector('.modal__close');
      this.showOnce = this.hasAttribute('data-show-once');

      console.log('showOnce', this.showOnce);

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
      if (this.shouldShowModal()) {
        this.setupEventListeners();
      }
    }

    setupEventListeners() {
      if (this.closeButton) {
        this.closeButton.addEventListener('click', () => this.close());
      }

      if (this.overlay) {
        this.overlay.addEventListener('click', (e) => {
          if (e.target === this.overlay) {
            this.close();
          }
        });
      }
    }

    shouldShowModal() {
      if (!this.showOnce) {
        return true;
      }

      const modalShown = sessionStorage.getItem('modalShown');
      return modalShown !== 'true';
    }

    open() {
      if (!this.shouldShowModal()) {
        return;
      }

      if (this.overlay) {
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (this.showOnce) {
          sessionStorage.setItem('modalShown', 'true');
        }
      }
    }

    close() {
      if (this.overlay) {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }

  customElements.define('featured-modal', FeaturedModal);
}
