/* Every controller should have its own routes and it will be designed here..
*/

import { Router } from "express";
import {healthCheck} from "../contollers/healthcheck.controllers.js"

const router = Router()

router.route("/").get(healthCheck)


export default router