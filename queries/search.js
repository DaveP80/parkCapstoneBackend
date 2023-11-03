const db = require("../db/dbConfig");

const {
  removeZipCode,
  splitStringIntoSubstrings,
} = require("../lib/helper/helper");

const { SQLSpaceTableError, SQLError } = require("../lib/errorHandler/customErrors");

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
      results.push({ zip: zip[0] });
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
    const results = await db.any(`Select ps.*, pr.prop_address, pr.zip, pr.billing_type from parking_spaces ps join properties pr on ps.property_lookup_id = pr.property_id where pr.location_verified = true`);
    if (!results?.length) {
      throw new SQLError("no data in spaces table")
    }

    let emptarray = [];
    
    let resultarr = [];
    
    let stringset = {};
    
    for (let s of substrings) {
      for (let o of results) {
        if (o.prop_address.includes(s)) {
          stringset[o.space_id] = (stringset[o.space_id] || 0) + 1;
        }
      }
    }
    if (Object.keys(stringset)?.length==0 && zip?.length > 0) {
      emptarray.push({ zip: zip[0] });
      return emptarray;
    }
    
    for (let g of results) {
      if (stringset.hasOwnProperty(g.space_id)) {
        resultarr.push({ num: stringset[g.space_id], ...g});
      }
    }

    resultarr.sort((a,b) => b.num - a.num);

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

const byZip = async (zip) => {
  try {
    const results = await db.any(
      `
          select
          ps.*,
          pr.prop_address,
          pr.zip
      from
          parking_spaces ps
      join properties pr on
          ps.property_lookup_id = pr.property_id
      where
          pr.zip = $1`,
      zip
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

const getSpace = async (args) => {
  try {
    return {};
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

module.exports = {
  getAll,
  getSpace,
  byAddr,
  byAddrB,
  byCity,
  byZip,
  byOccupied,
};
