const {
    confirmPmt,
    newTransaction,
    getTransactionsByUserId
  } = require("../queries/stripe");
  
  const confirmUserPmt = async (req, res, next) => {

    confirmPmt(req.body)
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((e) => {
        res.json({ error: e.error });
      });
  };

  const getClientTransactions = async (req, res, next) => {

    getTransactionsByUserId(req.user_id)
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((e) => {
        res.json({ error: e.error });
      });
  };

  const insertTransaction = async (req, res, next) => {
    console.log(req.user_id, ...req.body.data);

    newTransaction([req.user_id, ...req.body.data])
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((e) => {
        res.json({ error: e.error });
      });
  };

  module.exports = {
    confirmUserPmt,
    insertTransaction,
    getClientTransactions
  };  