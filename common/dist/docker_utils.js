"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDockerPlatform = exports.normalizeDockerOS = exports.normalizeDockerArchitecture = void 0;
/**
 * Normalizes Docker platform architecture names to standard format
 * @param architecture The architecture string from Docker manifest
 * @returns Normalized architecture string (amd64, arm64, arm, or original if not recognized)
 */
function normalizeDockerArchitecture(architecture) {
    if (!architecture) {
        return "amd64"; // default fallback
    }
    // Return original if not one of the standard architectures
    return architecture;
}
exports.normalizeDockerArchitecture = normalizeDockerArchitecture;
/**
 * Normalizes Docker platform OS name
 * @param os The OS string from Docker manifest
 * @returns Normalized OS string (defaults to "linux" if not provided)
 */
function normalizeDockerOS(os) {
    return os || "linux";
}
exports.normalizeDockerOS = normalizeDockerOS;
/**
 * Normalizes a Docker platform from manifest format to standard platform string
 * @param platform Platform object from Docker manifest with os and architecture
 * @returns Normalized platform string in format "os/arch" (e.g., "linux/amd64")
 */
function normalizeDockerPlatform(platform) {
    const os = normalizeDockerOS(platform.os);
    const arch = normalizeDockerArchitecture(platform.architecture);
    return `${os}/${arch}`;
}
exports.normalizeDockerPlatform = normalizeDockerPlatform;
//# sourceMappingURL=docker_utils.js.map