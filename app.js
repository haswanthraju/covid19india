const express = require("express");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started ");
    });
  } catch (e) {
    console.log(`error message: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    select state_id as stateId, state_name as stateName, population from state;
    `;
  const StatesArray = await db.all(getStatesQuery);
  response.send(StatesArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    select state_id as stateId, state_name as stateName, population from state
    where state_id = ${stateId};
    `;
  const StatesArray = await db.get(getStatesQuery);
  response.send(StatesArray);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertDistricts = `
    insert into district(
        district_name, state_id, cases, cured, active, deaths
    )values("${districtName}",
                ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
    );
    `;
  const dbresponse = await db.run(insertDistricts);
  console.log(dbresponse.lastID);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictbyid = `
    select district_id as districtId, district_name as districtName,
    state_id as stateId, cases, cured, active, deaths from district
    where district_id =${districtId};
    `;
  const test = `select * from district where district_id = ${districtId}`;
  const district = await db.get(getdistrictbyid);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
  delete from district where district_id = ${districtId}
  `;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateQuery = `
    update district
    set district_name = "${districtName}", state_id = ${stateId},
    cases =${cases}, cured = ${cured},active= ${active}, 
    deaths = ${deaths};
    `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const statsQuery = `
  select sum(cases) as totalCases, sum(cured) as totalCured,
  sum(active) as totalActive, sum(deaths) as totalDeaths from district where state_id = ${stateId} ;
  `;
  const statsArray = await db.get(statsQuery);
  response.send(statsArray);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getdisDetials = `
    select state.state_name as stateName
     from state
     inner join district on district.state_id = state.state_id
      where district_id = ${districtId}`;
  const dis = await db.get(getdisDetials);
  response.send(dis);
});

module.exports = app;
