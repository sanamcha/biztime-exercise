

const express = require("express");
const ExpressError = require("../expressError")
const slugify = require("slugify");
const db = require("../db");


const router = new express.Router();



// get list of companies..

router.get("/", async (req, res, next) => {
    try {
      const result = await db.query(`SELECT code, name FROM companies ORDER BY name`);
  
      return res.json({"companies": result.rows});
    }
  
    catch (err) {
      return next(err);
    }
  });


  
//get detail of company
  router.get("/:code", async (req, res, next) => {
    try {
      const code = req.params.code;
  
      const companyResult = await db.query( `SELECT code, name, description FROM companies WHERE code = $1`, [code]);
  
      const invoiceResult = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code]);
  
      if (companyResult.rows.length === 0) {
        throw new ExpressError(`Couldn't find such company: ${code}`, 404)
      }
  
      const company = companyResult.rows[0];
      const invoices = invoiceResult.rows;
  
      company.invoices = invoices.map(i => i.id);
  
      return res.json({"company": company});
    }
  
    catch (err) {
      return next(err);
    }
  });


  //add new company
  router.post("/", async (req, res, next) => {
    try {

        const {name, description} = req.body;
        const code = slugify(name, {lower: true});
  
        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3) 
             RETURNING code, name, description`,
          [code, name, description]);
  
      return res.status(201).json({"company": result.rows[0]});
    }
  
    catch (err) {
      return next(err);
    }
  });



// update company...
router.put("/:code", async (req, res, next) => {
  try {
    const {name, description} = req.body;
    const code = req.params.code;

    const result = await db.query(`UPDATE companies SET name=$1, 
            description=$2 WHERE code = $3
            RETURNING code, name, description`,[name, description, code]);

    if (result.rows.length === 0) {
      throw new ExpressError(`Couldn't find such company: ${code}`, 404)
    } else {
      return res.json({"company": result.rows[0]});
    }
  }

  catch (err) {
    return next(err);
  }

});

router.delete("/:code", async (req, res, next) => {
    try {
      const code = req.params.code;
  
      const result = await db.query(`DELETE FROM companies
             WHERE code=$1 RETURNING code`,[code]);
  
      if (result.rows.length == 0) {
        throw new ExpressError(`Coudn't find such company: ${code}`, 404)
      } else {
        return res.json({"status": "deleted"});
      }
    }
  
    catch (err) {
      return next(err);
    }
  });


  module.exports = router;