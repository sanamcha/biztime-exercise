
const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();


// get list of invoices.
 
router.get("/", async  (req, res, next) => {
  try {
    const result = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`);

    return res.json({"invoices": result.rows});
  }

  catch (err) {
    return next(err);
  }
});


//get details on invoice

router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;

    const result = await db.query(
          `SELECT invoices.id, 
                invoices.comp_code, 
                invoices.amt,  
                invoices.paid, 
                invoices.add_date, 
                invoices.paid_date, 
                companies.name, 
                companies.description 
            FROM invoices 
            INNER JOIN companies ON (invoices.comp_code = companies.code)  
           WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      throw new ExpressError(`Couldn't find such invoice: ${id}`,404);
    }

    const data = result.rows[0];
    const invoice = {id: data.id,
        amt: data.amt,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
      company: {
            code: data.comp_code,
            name: data.name,
            description: data.description,
          },
    };

    return res.json({"invoice": invoice});
  }

  catch (err) {
    return next(err);
  }
});


// add new invoice
 
router.post("/", async (req, res, next) => {
  try {
    const {comp_code, amt} = req.body;

    const result = await db.query(`INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]);

    return res.json({"invoice": result.rows[0]});
  }

  catch (err) {
    return next(err);
  }
});


// update invoice

router.put("/:id", async (req, res, next) => {
  try {
    const {amt, paid} = req.body;
    const id = req.params.id;
    const paidDate = null;

    const currentResult = await db.query(`SELECT paid FROM invoices WHERE id = $1`,[id]);

    if (currentResult.rows.length === 0) {
      throw new ExpressError(`Couldn't find such invoice: ${id}`, 404);
    }

    const currentPaidDate = currentResult.rows[0].paid_date;

    if (!currentPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null
    } else {
      paidDate = currentPaidDate;
    }

    const result = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
           WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, paid, paidDate, id]);

    return res.json({"invoice": result.rows[0]});
  }

  catch (err) {
    return next(err);
  }

});


//delete invoice
 
router.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const result = await db.query(
          `DELETE FROM invoices WHERE id = $1 RETURNING id`,[id]);

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no such invoice: ${id}`, 404);
    }

    return res.json({"status": "deleted"});
  }

  catch (err) {
    return next(err);
  }
});


module.exports = router;