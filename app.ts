import Maplet from "./maplet";
import Router from "./ags-route-proxy";
import Suggest from "./ags-suggest-proxy";
import FindAddress from "./ags-find-address-proxy";
import Find from "./ags-find-proxy";

window.onload = () => {
    //Maplet.test();
    Router.test();
    Suggest.test();
    FindAddress.test();
    Find.test();
}