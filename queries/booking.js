const db = require("../db/dbConfig");

const {
  removeZipCode,
  splitStringIntoSubstrings,
  closeZipCodes,
} = require("../lib/helper/helper");

const {
  SQLSpaceTableError,
  SQLError,
} = require("../lib/errorHandler/customErrors");

const byTimeAndZ = async (args) => {
  let requery = false;
  try {
    if (args[0]?.length) {
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
              pr.location_verified = true
              and space_id not in 
              (SELECT booking_space_id
                FROM bookings
                WHERE start_time < $2
                  AND end_time > $1 and is_occupied = true)) a
      order by
          count_spaces desc`,
          [args[2], args[3]]
          //$1 start_time
          //$2 end_time
        );
        if (results.length > 0) {
          let rzips = closeZipCodes(
            args[0],
            results.map((item) => item.zip)
          );
          let rest = results.filter((item) => rzips.includes(item.zip));
          if (rest.length > 0) return rest;
          else requery = true;
        } else if (!results.length) {
          requery = true;
        }
      } catch (e) {
        throw new SQLError(e);
      }
    }
    if (requery || !args[0]?.length) {
      try {
        [addr, zip] = removeZipCode(args[1]);
        let termsarr = addr;
        let substrings = splitStringIntoSubstrings(termsarr);
        try {
          const results = await db.any(
            `
      select
      ps.space_id,
      ps.space_no,
      ps.sp_type,
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
      pr.location_verified = true and space_id not in (SELECT booking_space_id
        FROM bookings
        WHERE start_time < $2
          AND end_time > $1 and is_occupied = true)`,
            [args[2], args[3]]
          );
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
            if (
              stringset.hasOwnProperty(g.property_id) &&
              stringset[g.property_id] > 2
            ) {
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
        else throw new SQLError(e);
      }
    }
  } catch (e) {
    throw e;
  }
};

const makeNewBooking = async(args) => {
        try {
          await db.tx(async (t) => {
            const queries =  t.none(
                `INSERT INTO 
                bookings(customer_booking_id, booking_space_id, final_cost, start_time, end_time, is_occupied) values (
                  $1, (select case when a.count_o < (select count(*) from bookings where booking_space_id = $2) then null else 
                  ${args[1]} end from (select count(*) count_o from bookings where booking_space_id = $2 and is_occupied = false) a), $3,
                  $4, $5, true  
                )`,
                args
                //customer_booking_id, booking_space_id, final_cost, start_time, end_time, is_occupied
              );
            await t.batch(queries);
          });
      
          return { success: true, message: `inserted row with booking_space_id: ${args[1]}, start_time: ${args[3]}` };
        } catch (error) {
          return { success: false, error: error.message };
        }

}

module.exports = {
  byTimeAndZ,
  makeNewBooking,
};
