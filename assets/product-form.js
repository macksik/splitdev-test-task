if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');
        this.continueButton = this.querySelector('[data-continue-to-cart]');
        this.addAllButton = this.querySelector('[data-add-to-cart-modal]');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';

        if (this.continueButton) {
          this.continueButton.addEventListener('click', this.onContinueHandler.bind(this));
        }

        if (this.addAllButton) {
          this.addAllButton.addEventListener('click', this.onAddAllHandler.bind(this));
        }
      }

      async onContinueHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        try {
          const response = await fetch(`${routes.cart_add_url}`, config);
          const parsedState = await response.json();

          if (response.ok) {
            this.handleErrorMessage();

            if (!this.error) {
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: parsedState,
              });
            }

            if (!this.cart) {
              return;
            }

            this.cart.renderContents(parsedState);
            const modal = this.closest('featured-modal');
            if (modal) {
              modal.close();
            }
          } else {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: parsedState.errors || parsedState.description,
              message: parsedState.message,
            });
            this.handleErrorMessage(parsedState.description);
          }
        } catch (error) {
          publish(PUB_SUB_EVENTS.cartError, {
            source: 'product-form',
            errors: error.message,
            message: error.message,
          });
          this.handleErrorMessage(error.message);
        } finally {
          this.submitButton.classList.remove('loading');
          this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading__spinner').classList.add('hidden');
          if (this.cart && this.cart.classList.contains('is-empty')) {
            this.cart.classList.remove('is-empty');
          }
        }
      }

      async onAddAllHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();
        this.error = false;

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const mainProductId = this.form.querySelector('[name="id"]').value;

        const modalProducts = Array.from(document.querySelectorAll('.modal__product')).map((product) => ({
          id: product.dataset.variantId || product.dataset.productId,
          quantity: 1,
        }));

        const items = [{ id: mainProductId, quantity: 1 }, ...modalProducts];

        const formData = new FormData();
        items.forEach((item) => {
          formData.append('items[][id]', item.id);
          formData.append('items[][quantity]', item.quantity);
        });

        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        try {
          const response = await fetch(`${routes.cart_add_url}`, config);
          const parsedState = await response.json();

          if (response.ok) {
            this.handleErrorMessage();

            if (!this.error) {
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: mainProductId,
                cartData: parsedState,
              });
            }

            if (!this.cart) {
              return;
            }

            let singleItemState = {};
            if (parsedState.items && parsedState.items.length > 0) {
              singleItemState = Object.assign({}, parsedState.items[0], { sections: parsedState.sections });
            } else {
              return;
            }

            this.cart.renderContents(singleItemState);

            const modal = this.closest('featured-modal');
            if (modal) {
              modal.close();
            }
          } else {
            this.error = true;
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: mainProductId,
              errors: parsedState.errors || parsedState.description,
              message: parsedState.message,
            });
            this.handleErrorMessage(parsedState.description);
          }
        } catch (error) {
          this.error = true;
          publish(PUB_SUB_EVENTS.cartError, {
            source: 'product-form',
            errors: error.message,
            message: error.message,
          });
          this.handleErrorMessage(error.message);
        } finally {
          this.submitButton.classList.remove('loading');
          if (!this.error) {
            this.submitButton.removeAttribute('aria-disabled');
          }
          this.querySelector('.loading__spinner').classList.add('hidden');
          if (this.cart && this.cart.classList.contains('is-empty')) {
            this.cart.classList.remove('is-empty');
          }
        }
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        if (this.form.dataset.type === 'show-modal-form') {
          const modal = document.querySelector('featured-modal');
          if (modal) {
            modal.open();
            return;
          }
        }

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
