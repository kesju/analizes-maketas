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
                    <Tab component={Link} to="/" label="Ekg List" />
                    <Tab component={Link} to="EkgGraph" label="EKG Graph" />
                    <Tab component={Link} to="EkgProps" label="Ekg Props" />
                    <Tab component={Link} to="EkgValues" label="Ekg Values" />
                    <Tab component={Link} to="EkgRpeaks" label="Ekg Rpeaks" />
                    <Tab component={Link} to="EkgNoises" label="Ekg Noises" />
                    <Tab component={Link} to="Analysis" label="Analysis" />
                    <Tab component={Link} to="Filtration" label="Filtration" />
                    <Tab component={Link} to="Testing" label="Testing" />
                </Tabs>
            </Toolbar>
        </AppBar>
        <Toolbar />
       </div>
    );
}