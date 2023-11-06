const db = require("../db/dbConfig");

const {
  removeZipCode,
  splitStringIntoSubstrings,
} = require("../lib/helper/helper");

const {
  SQLSpaceTableError,
  SQLError,
} = require("../lib/errorHandler/customErrors");

const getAll = async () => {
  try {
    const results = await db.any(`
    select
	ps.*,
	p.zip,
	p.picture,
	p.number_spaces,
	p.billing_type,
	p.prop_address
  from
	parking_spaces ps
  join properties p on
	ps.property_lookup_id = p.property_id
  `);

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

const byZipOrAddr = async (body) => {
  let requery = false;
  try {
    if (body.zipCode?.length) {
      try {
        const results = await db.any(
          `select
      a.*,
      count(*) over(partition by property_id) count_spaces,
      row_number() over(partition by property_id) row_num
    from
      (
      select
      ps.space_id,
      ps.space_no,
      ps.sp_type,
      ps.occupied,
      ps.last_used,
      ps.price,
      pr.prop_address,
      pr.property_id,
      pr.zip,
      pr.billing_type,
      pr.picture
      from
        parking_spaces ps
      join properties pr on
        ps.property_lookup_id = pr.property_id
      where
        pr.zip = $1 and pr.location_verified = true
      ) a
    order by
      count_spaces desc`,
          body.zipCode
        );
        if (results.length > 0) {
          return results;
        } else if (!results.length) {
          requery = true;
        }
      } catch (e) {
        throw new SQLError("no matches or sql syntax error");
      }
    }
    if (requery || !body.zipCode?.length) {
      try {
        [addr, zip] = removeZipCode(body.addr);
        let termsarr = addr;
        let substrings = splitStringIntoSubstrings(termsarr);
        try {
          const results = await db.any(`
      select
      ps.space_id,
      ps.space_no,
      ps.sp_type,
      ps.occupied,
      ps.last_used,
      ps.price,
      pr.prop_address,
      pr.property_id,
      pr.zip,
      pr.billing_type,
      pr.picture,
      count(*) over(partition by property_id) count_spaces,
      row_number() over(partition by property_id) row_num
    from
      parking_spaces ps
    join properties pr on
      ps.property_lookup_id = pr.property_id
    where
      pr.location_verified = true`);
          if (!results?.length) {
            throw new SQLError("no data in spaces table");
          }

          let resultarr = [];

          let stringset = {};

          for (let s of substrings) {
            for (let o of results) {
              if (o.row_num == 1) {
                if (o.prop_address.includes(s)) {
                  stringset[o.property_id] =
                    (stringset[o.property_id] || 0) + 1;
                }
              }
            }
          }
          for (let g of results) {
            if (stringset.hasOwnProperty(g.property_id)) {
              resultarr.push({ count_match: stringset[g.property_id], ...g });
            }
          }

          resultarr.sort((a, b) => b.count_match - a.count_match);

          return resultarr;
        } catch (e) {
          throw new SQLSpaceTableError(e);
        }
      } catch (e) {
        if (e instanceof SQLError || e instanceof SQLSpaceTableError) throw e;
        else throw new SQLError("no matches or sql syntax error");
      }
    }
  } catch (e) {
    throw e;
  }
};

const byAddr = async (addr) => {
  [addr, zip] = removeZipCode(addr);
  let termsarr = addr;
  let substrings = splitStringIntoSubstrings(termsarr);
  const ilikeConditions = substrings.map(
    (term) => `pr.prop_address ILIKE '%${term}%'`
  );

  const ilikeClause = ilikeConditions.join(" OR ");

  const query = `
    SELECT
      ps.*,
      pr.prop_address,
      pr.zip,
      pr.billing_type
    FROM
      parking_spaces ps
    JOIN
      properties pr ON ps.property_lookup_id = pr.property_id
    WHERE ${ilikeClause} and pr.location_verified = true`;

  try {
    const results = await db.any(query);

    if (!results?.length && zip?.length > 0) {
      results.push({ zip: zip[0], requery: true });
      return results;
    }

    return results;
  } catch (e) {
    throw new SQLSpaceTableError(e);
  }
};

const byAddrB = async (addr) => {
  [addr, zip] = removeZipCode(addr);
  let termsarr = addr;
  let substrings = splitStringIntoSubstrings(termsarr);
  try {
    const results = await db.any(
      `select ps.*, pr.prop_address, pr.zip, pr.billing_type, pr.property_id from parking_spaces ps join properties pr on ps.property_lookup_id = pr.property_id where pr.location_verified = true`
    );
    if (!results?.length) {
      throw new SQLError("no data in spaces table");
    }

    let resultarr = [];

    let stringset = {};

    for (let s of substrings) {
      for (let o of results) {
        if (o.prop_address.includes(s)) {
          stringset[o.property_id] = (stringset[o.property_id] || 0) + 1;
        }
      }
    }

    for (let g of results) {
      if (stringset.hasOwnProperty(g.property_id)) {
        resultarr.push({ num: stringset[g.property_id], ...g });
      }
    }

    resultarr.sort((a, b) => b.num - a.num);

    return resultarr;
  } catch (e) {
    if (e instanceof SQLError) throw e;
    throw new SQLSpaceTableError(e);
  }
};

const byCity = async (city) => {
  try {
    const results = await db.any(
      `
          select
          ps.*,
          pr.prop_address
          pr.zip
      from
          parking_spaces ps
      join properties pr on
          ps.property_lookup_id = pr.property_id
      where
          pr.zip ilike '%' || $1 || '%'
          and (
          select
              COUNT(*)
          from
              regexp_split_to_table(pr.zip,
              '') as t(sub)
          where
              LENGTH(t.sub) = 4
                  and t.sub ilike $1) >= 1`,
      city
    );

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

const byOccupied = async (args) => {
  try {
    const results = await db.any(
      `
          select
          ps.*,
          pr.zip
      from
          parking_spaces ps
      join properties pr on
          ps.property_lookup_id = pr.property_id
      where
          ps.occupied = $1 and pr.zip = $2`,
      [bool, zip]
    );

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

const byZip = async (body) => {
  try {
    const results = await db.any(
      `select
  a.*,
  count(*) over(partition by property_id) count_spaces,
  row_number() over(partition by property_id) row_num
from
  (
  select
  ps.space_id,
  ps.space_no,
  ps.sp_type,
  ps.occupied,
  ps.last_used,
  ps.price,
  pr.prop_address,
  pr.property_id,
  pr.zip,
  pr.billing_type,
  pr.picture
  from
    parking_spaces ps
  join properties pr on
    ps.property_lookup_id = pr.property_id
  where
    pr.zip = $1 and pr.location_verified = true
  ) a
order by
  count_spaces desc`,
      body.zipCode
    );

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

module.exports = {
  getAll,
  byZip,
  byAddr,
  byAddrB,
  byCity,
  byZipOrAddr,
  byOccupied,
};
