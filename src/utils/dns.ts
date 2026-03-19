import { IPv4, IPv6, parse } from "ipaddr.js";

export async function resolve(domain: string): Promise<IPv4 | IPv6 | null> {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`)
    if (!res.ok) throw new Error(`Failed to resolve ${domain}`)
    const json = await res.json()

    const rawIp = json.Answer[0].data;
    try {
        return parse(rawIp);
    } catch {
        return null;
    }
}