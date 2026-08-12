/**
 * ============================================================
 * SoufStock Enterprise ERP
 * utils.js
 * PART 1
 * Toast Manager
 * ============================================================
 */

const TOAST_CONTAINER_ID = "toastContainer";

const Toast = {

    duration: 4000,

    /**
     * ============================================================
     * Container
     * ============================================================
     */

    getContainer() {

        let container = document.getElementById(
            TOAST_CONTAINER_ID
        );

        if (!container) {

            container = document.createElement("div");

            container.id = TOAST_CONTAINER_ID;

            container.className = "toast-container";

            document.body.appendChild(container);

        }

        return container;

    },

    /**
     * ============================================================
     * Show
     * ============================================================
     */

    show(type, title, message, duration = null) {

        const container = this.getContainer();

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;

        const icons = {

            success: "fa-circle-check",

            error: "fa-circle-xmark",

            warning: "fa-triangle-exclamation",

            info: "fa-circle-info"

        };

        toast.innerHTML = `

            <div class="toast-icon">

                <i class="fa-solid ${icons[type] || icons.info}"></i>

            </div>

            <div class="toast-content">

                <h4>${title}</h4>

                <p>${message}</p>

            </div>

            <button class="toast-close">

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;

        container.appendChild(toast);

        const close = () => {

            toast.style.opacity = "0";

            toast.style.transform = "translateX(40px)";

            setTimeout(() => {

                toast.remove();

            }, 300);

        };

        toast
            .querySelector(".toast-close")
            .addEventListener("click", close);

        setTimeout(

            close,

            duration || this.duration

        );

    },

    /**
     * ============================================================
     * Success
     * ============================================================
     */

    success(title, message) {

        this.show(

            "success",

            title,

            message

        );

    },

    /**
     * ============================================================
     * Error
     * ============================================================
     */

    error(title, message) {

        this.show(

            "error",

            title,

            message

        );

    },

    /**
     * ============================================================
     * Warning
     * ============================================================
     */

    warning(title, message) {

        this.show(

            "warning",

            title,

            message

        );

    },

    /**
     * ============================================================
     * Info
     * ============================================================
     */

    info(title, message) {

        this.show(

            "info",

            title,

            message

        );

    },

    /**
     * ============================================================
     * Clear All
     * ============================================================
     */

    clear() {

        const container = this.getContainer();

        container.innerHTML = "";

    }

};
/**
 * ============================================================
 * SoufStock Enterprise ERP
 * utils.js
 * PART 2
 * Loader Manager
 * ============================================================
 */

const Loader = {

    element: null,

    title: null,

    message: null,

    /**
     * ============================================================
     * INIT
     * ============================================================
     */

    init() {

        this.element = document.getElementById(
            "fullscreenLoader"
        );

        this.title = document.getElementById(
            "loaderTitle"
        );

        this.message = document.getElementById(
            "loaderMessage"
        );

    },

    /**
     * ============================================================
     * SHOW
     * ============================================================
     */

    show(

        title = "Chargement...",

        message = "Veuillez patienter..."

    ) {

        if (!this.element) {

            this.init();

        }

        if (!this.element) return;

        if (this.title) {

            this.title.textContent = title;

        }

        if (this.message) {

            this.message.textContent = message;

        }

        this.element.classList.add("show");

        document.body.style.pointerEvents = "none";

    },

    /**
     * ============================================================
     * HIDE
     * ============================================================
     */

    hide() {

        if (!this.element) {

            this.init();

        }

        if (!this.element) return;

        this.element.classList.remove("show");

        document.body.style.pointerEvents = "";

    },

    /**
     * ============================================================
     * TOGGLE
     * ============================================================
     */

    toggle() {

        if (!this.element) {

            this.init();

        }

        if (!this.element) return;

        this.element.classList.toggle("show");

    },

    /**
     * ============================================================
     * IS VISIBLE
     * ============================================================
     */

    isVisible() {

        if (!this.element) {

            this.init();

        }

        return this.element
            ? this.element.classList.contains("show")
            : false;

    },

    /**
     * ============================================================
     * UPDATE TITLE
     * ============================================================
     */

    setTitle(text) {

        if (!this.title) {

            this.init();

        }

        if (this.title) {

            this.title.textContent = text;

        }

    },

    /**
     * ============================================================
     * UPDATE MESSAGE
     * ============================================================
     */

    setMessage(text) {

        if (!this.message) {

            this.init();

        }

        if (this.message) {

            this.message.textContent = text;

        }

    }

};

/**
 * ============================================================
 * SoufStock Enterprise ERP
 * utils.js
 * PART 3
 * FormUtils + Animation
 * ============================================================
 */

const FormUtils = {

    /**
     * ============================================================
     * Show Field Error
     * ============================================================
     */

    showFieldError(input, message) {

        if (!input) return;

        input.classList.add("error");

        const group = input.closest(".form-group");

        if (!group) return;

        let error = group.querySelector(".error-message");

        if (!error) {

            error = document.createElement("small");

            error.className = "error-message";

            group.appendChild(error);

        }

        error.textContent = message;

    },

    /**
     * ============================================================
     * Clear Field Error
     * ============================================================
     */

    clearFieldError(input) {

        if (!input) return;

        input.classList.remove("error");

        const group = input.closest(".form-group");

        if (!group) return;

        const error = group.querySelector(".error-message");

        if (error) {

            error.textContent = "";

        }

    },

    /**
     * ============================================================
     * Clear All Errors
     * ============================================================
     */

    clearAllErrors(form) {

        if (!form) return;

        form.querySelectorAll("input").forEach(input => {

            input.classList.remove("error");

        });

        form.querySelectorAll(".error-message").forEach(error => {

            error.textContent = "";

        });

    },

    /**
     * ============================================================
     * Reset Form
     * ============================================================
     */

    reset(form) {

        if (!form) return;

        form.reset();

        this.clearAllErrors(form);

    }

};

/**
 * ============================================================
 * Animation
 * ============================================================
 */

const Animation = {

    /**
     * ============================================================
     * Shake
     * ============================================================
     */

    shake(element) {

        if (!element) return;

        element.animate(

            [

                { transform: "translateX(0)" },

                { transform: "translateX(-8px)" },

                { transform: "translateX(8px)" },

                { transform: "translateX(-6px)" },

                { transform: "translateX(6px)" },

                { transform: "translateX(0)" }

            ],

            {

                duration: 450,

                easing: "ease"

            }

        );

    },

    /**
     * ============================================================
     * Fade In
     * ============================================================
     */

    fadeIn(element, duration = 300) {

        if (!element) return;

        element.style.opacity = "0";

        element.style.display = "";

        element.animate(

            [

                { opacity: 0 },

                { opacity: 1 }

            ],

            {

                duration

            }

        );

        element.style.opacity = "1";

    },

    /**
     * ============================================================
     * Fade Out
     * ============================================================
     */

    fadeOut(element, duration = 300) {

        if (!element) return;

        const animation = element.animate(

            [

                { opacity: 1 },

                { opacity: 0 }

            ],

            {

                duration

            }

        );

        animation.onfinish = () => {

            element.style.display = "none";

        };

    },

    /**
     * ============================================================
     * Scale
     * ============================================================
     */

    pulse(element) {

        if (!element) return;

        element.animate(

            [

                { transform: "scale(1)" },

                { transform: "scale(1.05)" },

                { transform: "scale(1)" }

            ],

            {

                duration: 350

            }

        );

    }

};

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {

    Toast,

    Loader,

    FormUtils,

    Animation

};
