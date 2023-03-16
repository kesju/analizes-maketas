import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {Link} from "react-router-dom";

export default function Header(props) {
    return (
        <div>
        <AppBar position="fixed" color="default">
            <Toolbar>
                {/* <Tabs className = {classes.tabContainer}> */}
                <Tabs value={0}>
                    <Tab component={Link} to="/" label="Sąrašas" />
                    <Tab component={Link} to="EkgGraph" label="Anot.įrašas" />
                    <Tab component={Link} to="EkgPrm" label="Parametrai" />
                    <Tab component={Link} to="Analysis" label="Orig.analizė" />
                    {/* <Tab component={Link} to="EkgValues" label="Ekg Values" /> */}
                    {/* <Tab component={Link} to="EkgRpeaks" label="Ekg Rpeaks" /> */}
                    <Tab component={Link} to="EkgNoises" label="Triukšmai" />
                    <Tab component={Link} to="Filtration" label="Filtravimas" />
                    <Tab component={Link} to="Testing" label="Testas" />
                </Tabs>
            </Toolbar>
        </AppBar>
        <Toolbar />
       </div>
    );
}