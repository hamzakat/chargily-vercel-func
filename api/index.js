export default (req, res) => {
  const chargily = require("chargily-epay-gateway");
  const { Invoice, Mode } = require("chargily-epay-gateway/lib/configuration");

  const body = req.body;

  if (Object.keys(body).length === 0) {
    res.status(400).json({ message: "body must not be empty" });
    return;
  }

  if (
    !body.invoice_number ||
    !body.amount ||
    !body.client ||
    !body.client_email ||
    !body.discount
  ) {
    res.status(400).json({
      message:
        "invoice_number, amount, client, client_email and discount must be provided",
    });
    return;
  }

  if (body.discount < 0 || body.discount > 99) {
    res.status(400).json({ message: "discount must be between 0 and 99" });
    return;
  }
  if (body.amount < 75) {
    res.status(400).json({ message: "amount must be greater than 100" });
    return;
  }
  if (body.invoice_number < 1) {
    res.status(400).json({ message: "invoice number must be greater than 0" });
    return;
  }
  if (body.client?.length < 1) {
    res.status(400).json({ message: "client name must be provided" });
    return;
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(body.client_email)) {
    res.status(400).json({ message: "client_email must be a valid email" });
    return;
  }

  const order = new Invoice();
  order.invoiceNumber = body.invoice_number; // must be integer or string
  order.mode = Mode.EDAHABIA; // or Mode.CIB
  order.backUrl = process.env.BACK_URL; // must be a valid and active URL
  order.amount = body.amount; // must be integer , and more or equal 75
  order.webhookUrl = process.env.WEBHOOK_URL; // this URL where receive the response
  order.client = body.client;
  order.discount = body.discount; // by percentage between [0, 100]
  order.clientEmail = body.client_email; // email of customer where he will receive the Bill
  order.appKey = process.env.CHARGILY_APP_KEY;

  chargily
    .createPayment(order)
    .then((checkoutUrl) => {
      res.status(200).json(checkoutUrl);
      console.log(order, checkoutUrl);
    })
    .catch((error) => {
      console.log(error);
    });
};
