// ==UserScript==
// @name     DSigner ActiveX API emulator
// @version  1
// @include  https://www.slovensko.sk/Services/Ives/*
// @grant    none
// ==/UserScript==

let disig_prefix = 'https://www.slovensko.sk/static/zep/dbridge_js/v1.0'

for (let m of ["config.js", "dCommon.min.js", "dSigXades.min.js", "dSigXadesBp.min.js"]) {
    let script = document.createElement('script')
    script.type = "text/javascript"
    script.async = false
    script.src = disig_prefix + "/" + m
    document.head.appendChild(script)
}

console.log("DSigner JS API loaded")

window.eval('(' + (() => {

    window.ActiveXObject = function (name) {
        let promisify = function (f) {
            return function (...args) {
                return new Promise((resolve, reject) => {
                    let callback = {
                        onSuccess: (x) => {
                            resolve(x || 0)
                        },
                        onFailure: (x) => {
                            reject(x || -1)
                        }
                    }
                    console.log("calling", f, args, callback)
                    f.call(ditec.dSigXadesJs, ...args, callback)
                })
            }
        }

        console.log("Requested ActiveXObject " + name);
        if (name == "DSig.XadesSigAtl") {
            let deploy = promisify(ditec.dSigXadesJs.deploy)
            let initialize = promisify(ditec.dSigXadesJs.initialize)
            let setSigningTimeProcessing = promisify(ditec.dSigXadesJs.setSigningTimeProcessing)
            let sign = promisify(ditec.dSigXadesJs.sign)
            let addXmlObject = promisify(ditec.dSigXadesJs.addXmlObject)
            let getSignedXmlWithEnvelope = promisify(ditec.dSigXadesJs.getSignedXmlWithEnvelope)

            this.AddObject = async function (args) {
                console.log("Deploy")
                await deploy({})
                console.log("Initialize")
                await initialize()
                console.log("AddObject", args)
                return await addXmlObject(...args)
            }
            this.SetSigningTimeProcessing = async function (...args) {
                console.log("(disabled) SetSigningTimeProcessing", args)
                return 0
            }
            this.Sign = async function (a, b, c) {
                args = [a, 'http://www.w3.org/2001/04/xmlenc#' + b, c]
                console.log("Sign", args)
                await sign(...args)
                return 0
            }
            this.SignedXMLWithEnvelope = async function () {
                console.log("SignedXMLWithEnvelope", args)
                return await getSignedXmlWithEnvelope()
            }

            return this
        }
        if (name == "DSig.XmlPluginAtl") {
            this.CreateObject = function (...args) {
                return args
            }
            return this
        }
    }
    if ("dsignerDoSign" in window) {
        window.eval(' async ' + dsignerDoSign.toString().replace("dsignerDoSign", "asyncDsignerDoSign").replace(/oXML\./g, "await oXML.").replace("SignedXMLWithEnvelope", "SignedXMLWithEnvelope()"))
        dsignerDoSign = function (ev) {
            try {
                (async function () {
                    if (await asyncDsignerDoSign()) {
                        let b = ev.target
                        b.onclick = () => true
                        b.click()
                    }
                })()
            } catch (e) {
                console.log(e)
            }
            return false
        }
        let b = $("input#ctl00_MainContentPlaceHolder_btnDsignerSign")[0]
        b.onclick = dsignerDoSign
    }
}) + ')()')

console.log("DSigner ActiveX API emulation enabled")
