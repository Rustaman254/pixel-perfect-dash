(function () {
    // Ripplify Checkout Widget 
    console.log("Ripplify SDK: Loading...");
    const Ripplify = {
        init: function () {
            this.injectStyles();
        },

        injectStyles: function () {
            if (document.getElementById('ripplify-styles')) return;
            const style = document.createElement('style');
            style.id = 'ripplify-styles';
            style.innerHTML = `
                .ripplify-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .ripplify-modal-container {
                    width: 100%;
                    max-width: 450px;
                    height: 90vh;
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .ripplify-modal-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 32px;
                    height: 32px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    z-index: 10;
                    border: none;
                    font-size: 20px;
                    line-height: 1;
                }
                .ripplify-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .ripplify-show {
                    opacity: 1 !important;
                }
                .ripplify-show .ripplify-modal-container {
                    transform: translateY(0) !important;
                }
                .ripplify-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: #025864;
                    color: white;
                    border: none;
                    padding: 0 24px;
                    height: 48px;
                    border-radius: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(2, 88, 100, 0.2), 0 2px 4px -1px rgba(2, 88, 100, 0.1);
                    width: 100%;
                    max-width: 320px;
                }
                .ripplify-button:hover {
                    background: #013a42;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(2, 88, 100, 0.3);
                }
                .ripplify-button:active {
                    transform: translateY(0);
                }
                .ripplify-button svg {
                    width: 20px;
                    height: 20px;
                }
            `;
            document.head.appendChild(style);
        },

        open: function (slug) {
            this.init();

            const overlay = document.createElement('div');
            overlay.className = 'ripplify-modal-overlay';

            const container = document.createElement('div');
            container.className = 'ripplify-modal-container';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'ripplify-modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => this.close();

            const iframe = document.createElement('iframe');
            iframe.className = 'ripplify-iframe';
            iframe.src = `http://localhost:8080/pay/${slug}?widget=true`;

            container.appendChild(closeBtn);
            container.appendChild(iframe);
            overlay.appendChild(container);
            document.body.appendChild(overlay);

            // Trigger animation
            setTimeout(() => overlay.classList.add('ripplify-show'), 10);

            this.currentModal = overlay;

            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) this.close();
            };
        },

        close: function () {
            if (this.currentModal) {
                this.currentModal.classList.remove('ripplify-show');
                setTimeout(() => {
                    if (this.currentModal && this.currentModal.parentNode) {
                        this.currentModal.parentNode.removeChild(this.currentModal);
                    }
                    this.currentModal = null;
                }, 300);
            }
        },

        Buttons: function (config) {
            const self = this;
            return {
                render: function (selector) {
                    self.init();
                    const container = document.querySelector(selector);
                    if (!container) {
                        console.error("Ripplify: Container not found:", selector);
                        return;
                    }

                    const button = document.createElement('button');
                    button.className = 'ripplify-button';
                    button.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        <span>${config.label || 'Pay with RippliFy'}</span>
                    `;

                    button.onclick = function () {
                        if (config.slug) {
                            self.open(config.slug);
                        } else if (config.onClick) {
                            config.onClick();
                        }
                    };

                    container.innerHTML = '';
                    container.appendChild(button);
                }
            };
        }
    };

    window.Ripplify = Ripplify;
})();
