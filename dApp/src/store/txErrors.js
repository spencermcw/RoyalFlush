// Turn an ethers / wallet / Ganache error into one short line for an error alert.
export function txErrorMessage(e) {
    if (!e)
        return "Unknown error"
    if (e.code === 4001 || e.code === "ACTION_REJECTED" || /user (rejected|denied)/i.test(e.message || ""))
        return "Transaction rejected."
    // Revert reasons sit in different places depending on the provider and ethers' wrapping.
    const candidates = [e.reason, e.error && e.error.message, e.data && e.data.message, e.message]
    for (const text of candidates) {
        if (typeof text !== "string" || !text)
            continue
        const reason = text.match(/reverted with reason string '([^']+)'/) || text.match(/revert(?:ed)?:? ([^"\n]+)/i)
        if (reason && reason[1] && !/^\s*$/.test(reason[1]))
            return reason[1].trim()
    }
    const text = candidates.find(t => typeof t === "string" && t) || String(e)
    if (/revert/i.test(text))
        return "The transaction was reverted."
    return text.length > 160 ? `${text.slice(0, 157)}...` : text
}
