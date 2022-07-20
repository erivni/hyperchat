import { useEffect, useState } from "react"

const keyTransform = (key) => `hsChatApp_${key}`

function getSavedValue(key, initialValue) {
    if (typeof window !== "undefined") {
        const savedValue = JSON.parse(localStorage.getItem(key));
        if (savedValue) return savedValue;
        if (initialValue instanceof Function) return initialValue()
        return initialValue;
    }
}

export default function useLocalStorage(_key, initialValue) {
    const key = keyTransform(_key)
    const [state, setState] = useState(() => {
        return getSavedValue(key, initialValue)
    })
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state))
    }, [state])
    return [state, setState]
}