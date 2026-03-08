(function () {
    // Ripplify Checkout Widget
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
            iframe.src = `http://localhost:8081/pay/${slug}?widget=true`;

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
        }
    };

    window.Ripplify = Ripplify;
})();
