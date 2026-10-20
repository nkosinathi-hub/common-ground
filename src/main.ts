import { mount } from "svelte"
import App from "./app/App.svelte"
import { isFramed, refuseFrame } from "./app/framing"
import "./app.css"

const target = document.getElementById("app")!
if (isFramed(window)) refuseFrame(target, location.href)
else mount(App, { target })
