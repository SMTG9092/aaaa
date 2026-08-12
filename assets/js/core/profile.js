/**
 * ============================================================
 * SoufStock Enterprise ERP
 * profile.js
 * ============================================================
 */

import Api from "./api.js";
import SessionManager from "./session.js";
import { Toast } from "./utils.js";

class ProfileManager {

    constructor() {

        this.profile = null;

    }

/* ============================================================
 * LOAD
 * ============================================================ */

async load() {

    try {

        const session = await SessionManager.getProfile();

        if (!session || !session.id) {

            throw new Error("Utilisateur non connecté.");

        }

        this.profile = await Api.getProfile(session.id);

        this.render();

        return this.profile;

    }

    catch (error) {

        console.error("[PROFILE]", error);

        Toast.error(

            "Profil",

            error.message

        );

        return null;

    }

}

/* ============================================================
 * RENDER
 * ============================================================ */

render() {

    if (!this.profile) return;

    const fullName =

        this.profile.nom_complet ||

        `${this.profile.prenom || ""} ${this.profile.nom || ""}`.trim() ||

        this.profile.username ||

        "Utilisateur";

    const role =

        this.profile.roles?.nom ||

        this.profile.poste ||

        "Utilisateur";

    this.text("sidebarUserName", fullName);
    this.text("topbarUserName", fullName);
    this.text("welcomeName", fullName);

    this.text("sidebarUserRole", role);
    this.text("topbarUserRole", role);

    this.text("profileEmail", this.profile.email || "");
    this.text("profileService", this.profile.service || "");
    this.text("profilePoste", this.profile.poste || "");

    this.image("sidebarAvatar", this.profile.photo);
    this.image("topbarAvatar", this.profile.photo);

}
    
/* ============================================================
 * HELPERS
 * ============================================================ */

text(id, value = "") {

    const element = document.getElementById(id);

    if (element) {

        element.textContent = value ?? "";

    }

}

image(id, src) {

    const element = document.getElementById(id);

    if (!element) return;

    if (src) {

        element.src = src;

    }

}

/* ============================================================
 * REFRESH
 * ============================================================ */

async refresh() {

    return await this.load();

}

/* ============================================================
 * GETTERS
 * ============================================================ */

get() {

    return this.profile;

}

getId() {

    return this.profile?.id ?? null;

}

getName() {

    return (

        this.profile?.nom_complet ||

        `${this.profile?.prenom || ""} ${this.profile?.nom || ""}`.trim() ||

        this.profile?.username ||

        ""

    );

}

getUsername() {

    return this.profile?.username ?? "";

}

getRole() {

    return (

        this.profile?.roles?.nom ||

        this.profile?.poste ||

        ""

    );

}

getRoleCode() {

    return this.profile?.roles?.code ?? "";

}

getEmail() {

    return this.profile?.email ?? "";

}

getService() {

    return this.profile?.service ?? "";

}

getPhoto() {

    return this.profile?.photo ?? "";

}

isActive() {

    return this.profile?.actif === true;

}

isLoaded() {

    return this.profile !== null;

}

/* ============================================================
 * CLEAR
 * ============================================================ */

clear() {

    this.profile = null;

}

}

const Profile = new ProfileManager();

export default Profile;
