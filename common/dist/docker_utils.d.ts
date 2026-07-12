/**
 * Normalizes Docker platform architecture names to standard format
 * @param architecture The architecture string from Docker manifest
 * @returns Normalized architecture string (amd64, arm64, arm, or original if not recognized)
 */
export declare function normalizeDockerArchitecture(architecture: string | undefined): string;
/**
 * Normalizes Docker platform OS name
 * @param os The OS string from Docker manifest
 * @returns Normalized OS string (defaults to "linux" if not provided)
 */
export declare function normalizeDockerOS(os: string | undefined): string;
/**
 * Normalizes a Docker platform from manifest format to standard platform string
 * @param platform Platform object from Docker manifest with os and architecture
 * @returns Normalized platform string in format "os/arch" (e.g., "linux/amd64")
 */
export declare function normalizeDockerPlatform(platform: {
    os?: string;
    architecture?: string;
}): string;
