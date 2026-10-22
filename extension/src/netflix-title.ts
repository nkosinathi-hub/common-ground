const WATCH = /^\/watch\/(\d+)\/?$/

/** The Netflix title id of a watch page (/watch/81234567), or null on any other page. */
export const titleIdFrom = (pathname: string): string | null => WATCH.exec(pathname)?.[1] ?? null
