import Maplet from "./maplet";
import RouteSolve from "./ags-route-solve-proxy";
import Suggest from "./ags-suggest-proxy";
import FindAddress from "./ags-find-address-proxy";
import Find from "./ags-find-proxy";
import ReverseGeocode from "./ags-reverse-geocode-proxy";
import ServiceSolve from "./ags-servicearea-solve-proxy";

window.onload = () => {
    //Maplet.test();
    //Suggest.test();
    //FindAddress.test();
    //Find.test();
    //ReverseGeocode.test();
    //RouteSolve.test();
    ServiceSolve.test();
}