const sql = require('../config/database')

const Account = function(account){
  this.email = account.email
  this.password = account.password
  this.role = account.role  
}

Account.create = (newAccount, result) => {
  sql.query("INSERT INTO account SET ?", newAccount, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newAccount });
  });
};

Account.findById = (id, result) => {
  sql.query("SELECT * FROM account WHERE id = ?", [id], (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

Account.findByEmail = (email, result) => {
  sql.query("SELECT * FROM account WHERE email = ?", [email], (err, res) => {
    if (err) {
      console.log("error: ", err);
      return result(err, null);
    }

    if (res.length > 0) {
      return result(null, res[0]);
    }

    return result(null, null);
  });
};

Account.getAll = (email, requesterRole, result) => {
  let query = "SELECT * FROM account";
  let params = [];

  if (email) {
    query += " WHERE email LIKE ?";
    params.push(`%${email}%`);
  }

  if (requesterRole !== 'superadmin') {
    query += (email ? " AND" : " WHERE") + " role != 'superadmin'";
  }

  sql.query(query, params, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Account.updateById = (id, account, result) => {
    sql.query("SELECT role FROM account WHERE id = ?", [id], (err, res1) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res1.length === 0) {
            result({ kind: "not_found" }, null);
            return;
        }

        if (res1[0].role === "superadmin" && account.role !== "superadmin") {
            result({ kind: "forbidden_superadmin_change" }, null);
            return;
        }

        let fields = [];
        let values = [];

        if (account.email) {
            fields.push("email = ?");
            values.push(account.email);
        }

        if (account.password !== undefined) { 
            fields.push("password = ?");
            values.push(account.password);
        }

        if (account.role) {
            fields.push("role = ?");
            values.push(account.role);
        }

        if (fields.length === 0) return result(null, { id: id, ...account });

        values.push(id);
        const query = `UPDATE account SET ${fields.join(", ")} WHERE id = ?`;

        sql.query(query, values, (err, res2) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            result(null, { id: id, ...account });
        });
    });
};

Account.remove = (id, result) => {
  sql.query("SELECT role FROM account WHERE id = ?", [id], (err, res1) => {
    if (err) {
      result(err, null);
      return;
    }

    if (res1.length === 0) {
      result({ kind: "not_found" }, null);
      return;
    }

    if (res1[0].role === "superadmin") {
      result({ kind: "forbidden_superadmin" }, null);
      return;
    }

    sql.query("DELETE FROM account WHERE id = ?", [id], (err, res2) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res2);
    });
  });
};

Account.updatePasswordByEmail = (email, hashedPassword, result) => {
  sql.query(
    "UPDATE account SET password = ? WHERE email = ?",
    [hashedPassword, email],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

module.exports = Account;