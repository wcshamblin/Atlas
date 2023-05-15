import {Navigate} from "react-router-dom";
import React from "react";
import { acceptEula } from "../services/message.service";
import {useAuth0} from "@auth0/auth0-react";


export const Eula = () => {
    const { getAccessTokenSilently } = useAuth0();

    const acceptEulaWithToken = async () => {
        const accessToken = await getAccessTokenSilently();
        await acceptEula(accessToken);
        // refresh the page
        window.location.reload();
    }


    return (
        <div className="eula-container" style={{height: "100%", backgroundImage: "url(https://i.imgur.com/RibRwE5.png)", backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat"}}>
        <div className="content-layout">
                <h1 id="page-title" className="content__title">
                        End User License Agreement
                </h1>

            <div className="content__body">
                <p>By using this application, you agree to the following terms:</p>
                <p>END USER LICENSE AGREEMENT ("EULA")</p>

                <p>PLEASE READ THIS EULA CAREFULLY BEFORE USING THE ATLAS WEBSITE ("WEBSITE"). BY USING THE WEBSITE, YOU AGREE TO BE BOUND BY THE TERMS AND CONDITIONS OF THIS EULA. IF YOU DO NOT AGREE TO THE TERMS AND CONDITIONS OF THIS EULA, DO NOT USE THE WEBSITE.</p>

                <p><strong>License Grant</strong><br/>
                Subject to your compliance with the terms and conditions of this EULA, Atlas grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Website.</p>

                <p><strong>Disclaimer of Liability</strong><br/>
                The Website is provided for informational purposes only, and Atlas makes no representations or warranties about the accuracy, completeness, or reliability of any information on the Website. The information on the Website is provided "as is" and "as available" without any warranties of any kind.</p>

                <p>You acknowledge and agree that participating in activities that involve urban exploration and climbing can be dangerous and may result in <strong style={{color: "red"}}>serious injury, death, or legal consequences</strong>. You assume all risks associated with such activities and release Atlas from any and all liability arising from or in connection with your participation in such activities.</p>

                <p><strong>Reservation of Rights</strong><br/>
                Atlas reserves the right to modify, suspend, or discontinue the Website at any time without notice. Atlas also reserves the right to ban any user from the Website at any time, with or without reason.</p>

                <p><strong>Governing Law</strong><br/>
                This EULA shall be governed by and construed in accordance with the laws of the State of North Carolina, without giving effect to any principles of conflicts of law. Any legal action or proceeding arising out of or in connection with this EULA shall be brought exclusively in the state or federal courts located in North Carolina.</p>

                <p><strong>Entire Agreement</strong><br/>
                This EULA constitutes the entire agreement between you and Atlas with respect to the Website and supersedes all prior or contemporaneous communications and proposals, whether oral or written, between you and Atlas. If any provision of this EULA is held to be invalid or unenforceable, the remaining provisions shall continue to be valid and enforceable.</p>

                    <button className="btn btn-primary" onClick={acceptEulaWithToken} style={{display: "block", margin: "auto"}}>
                        Accept
                    </button>
            </div>
        </div>
        </div>
    )
}