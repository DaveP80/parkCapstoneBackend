const db = require("../db/dbConfig");

const { SQLSpaceTableError } = require("../lib/errorHandler/customErrors");

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
      pr.prop_address ilike '%' || $1 || '%'
      and (
      select
          COUNT(*)
      from
          regexp_split_to_table(pr.prop_address,
          ' ') as t(sub)
      where
          LENGTH(t.sub) = 3
              and t.sub ilike $1) >= 1`,
      addr.replaceAll("%20", " ")
    );

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
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
          pr.prop_address
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
  byCity,
  byZip,
  byOccupied,
};
