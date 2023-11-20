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
//Search by zipcode and or address for spaces that are unoccupied and by time block
const byUserId = async (args) => {
  try {
    const results = await db.any(
      `select * from bookings where customer_booking_id = $1 order by is_occupied, end_time desc`,
      args
    );

    return results;
  } catch (e) {
    throw new SQLError(e);
  }
};

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
                    (
              select
                  booking_space_id
              from
                  bookings
              where
                  booking_space_id = space_id
                  and ((start_time,
                  end_time) 
                overlaps ('${args[2]}',
                  '${args[3]}')))) a
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
      pr.location_verified = true and space_id not in (
        select
            booking_space_id
        from
            bookings
        where
            booking_space_id = space_id
            and ((start_time,
            end_time) 
          overlaps ('${args[2]}',
            '${args[3]}')))`
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

const byGeoAndTime = async (args) => {
      try {
        const results = await db.any(
          `select
          a.*,
          count(*) over(partition by property_id) count_spaces,
          row_number() over(partition by property_id order by price) row_num
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
            pr.latitude,
            pr.longitude,
            pr.picture
          from
            parking_spaces ps
          join properties pr on
            ps.property_lookup_id = pr.property_id
          where
            pr.location_verified = true
            and space_id not in 
                            (
            select
              booking_space_id
            from
              bookings
            where
              booking_space_id = space_id
              and ((start_time,
              end_time) 
                        overlaps ('${args[2]}',
                        '${args[3]}')))) a
        order by
          point(latitude,
          longitude) <-> point($1,
          $2),
          count_spaces desc`,
          args
        );
      return results;
  } catch (e) {
    throw e;
  }
};

const byTimeAndPropertyId = async (args) => {
  try {
    const results = await db.any(
      `select
          a.*,
          count(*) over() count_spaces,
          row_number() over(partition by sp_type) row_num
      from
          (
          select
              ps.space_id,
              ps.space_no,
              ps.sp_type,
              ps.last_used,
              ps.price,
              pr.owner_id,
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
              and left(pr.property_id::TEXT, 13) ilike '${args[0]}'
              and space_id not in 
                    (
              select
                  booking_space_id
              from
                  bookings
              where
                  booking_space_id = space_id
                  and ((start_time,
                  end_time) 
                overlaps ('${args[1]}',
                  '${args[2]}')) and is_occupied = true)) a
      order by
          price`,
      args
      //$2 start_time
      //$3 end_time
    );
    return results;
  } catch (e) {
    throw e;
  }
};

const makeNewBooking = async (id, args) => {
  let newBookingId;
  try {
    await db.tx(async (t) => {
      const query = `
          insert into bookings(customer_booking_id, booking_space_id, final_cost, start_time, end_time, is_occupied)
          values (
            $1,
            (select space_id from parking_spaces where space_id = $2 and space_id not in (
              select
              booking_space_id
          from
              bookings
          where
              booking_space_id = $2
              and ((start_time,
              end_time) 
            overlaps ('${args[2]}',
              '${args[3]}')) and is_occupied = true)), $3, $4, $5, true) RETURNING booking_id;`;
      try {
        const result = await t.one(query, [
          id,
          args[0],
          args[1],
          args[2],
          args[3],
        ]);
        newBookingId = result.booking_id;
      } catch (error) {
        throw error;
      }
    });
    return {
      success: true,
      message: `inserted row with booking_space_id: ${args[0]}, start_time: ${args[2]}`,
      booking_id: newBookingId,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  byUserId,
  byTimeAndZ,
  byGeoAndTime,
  byTimeAndPropertyId,
  makeNewBooking,
};
