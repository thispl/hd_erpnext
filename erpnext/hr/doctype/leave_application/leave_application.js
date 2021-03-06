// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

cur_frm.add_fetch('employee','employee_name','employee_name');
cur_frm.add_fetch('employee','company','company');

frappe.ui.form.on("Leave Application", {
    onload: function(frm) {
        if (!frm.doc.posting_date) {
            frm.set_value("posting_date", frappe.datetime.get_today());
        }

        frm.set_query("leave_approver", function() {
            return {
                query: "erpnext.hr.doctype.leave_application.leave_application.get_approvers",
                filters: {
                    employee: frm.doc.employee
                }
            };
        });

        frm.set_query("employee", erpnext.queries.employee);

    },

    validate: function(frm) {
        // if(frm.doc.employee){
        //     frappe.call({
        //         "method": 'hunter_douglas.update_attendance.check_other_docs',
        //         args: {
        //             "employee": frm.doc.employee,
        //             "from_date": frm.doc.from_date,
        //             "to_date": frm.doc.to_date,
        //             "from_date_session": frm.doc.from_date_session,
        //             "to_date_session": frm.doc.to_date_session
        //         },
        //         callback: function (r) {
        //             if(r.message != 0){
        //                 var type = r.message.type 
        //                 var date = r.message.date
        //                 validated = false
        //                 var s = "You Already Applied type on date"
        //                 var rs = s.replace("type",type).replace("date",date)
        //                 frappe.msgprint(rs)
        //             }
        //         }
        //     })
        // } 
        frm.toggle_reqd("half_day_date", frm.doc.half_day == 1);
        if(!frappe.user.has_role("Auto Present Employee") && (frappe.user.has_role("Employee"))){
            frappe.call({
                "method": 'hunter_douglas.hunter_douglas.doctype.on_duty_application.on_duty_application.check_attendance',
                args: {
                    "employee": frm.doc.employee,
                    "from_date": frm.doc.from_date,
                    "to_date": frm.doc.to_date
                },
                callback: function(r) {
                    if (r.message) {
                        $.each(r.message, function(i, d) {
                            if(d.status == "Present"){
                                frappe.msgprint("Attendance already Marked as Present for "+d.attendance_date)
                                frappe.validated = false;
                            } else if(d.status == "Half Day"){
                                if(frm.doc.from_date == frm.doc.to_date){
                                    if(frm.doc.from_date_session == "Full Day"){
                                        frappe.msgprint("Attendance already Marked as Half Day for "+d.attendance_date)
                                        frappe.validated = false;
                                    } 
                                } else if(frm.doc.from_date != frm.doc.to_date){
                                    if((frm.doc.from_date_session == "Full Day") || (frm.doc.to_date_session == "Full Day")){
                                        frappe.msgprint("Attendance already Marked as Half Day for "+d.attendance_date)
                                        frappe.validated = false;
                                    }
                                
                            }
                        }
                        })
                    }
                }
            });
        }
        if(frm.doc.is_from_ar && frm.doc.status == "Applied"){
            frappe.set_route("query-report", "Attendance recapitulation")
        }
        // if(frm.doc.from_date){
        //     frappe.call({
        //         "method": "erpnext.hr.doctype.leave_application.leave_application.check_attendance",
        //         args:{
        //             "emp": frm.doc.employee,
        //             "att_date": frm.doc.from_date,
        //             "l_type": frm.doc.leave_type1
        //         },
        //         callback: function(r){
        //             if(r.message == "Allowed"){
        //             }
        //             else{
        //                 frappe.msgprint(r.message)
        //                 frappe.validated = false;

        //             }
        //         }
        //     })
        // }
    },

    refresh: function(frm) {
        
        // var from_time_picker = frm.fields_dict.from_date.datepicker;
        // var dt = new Date();
        // var month = dt.getMonth();
        // var year = dt.getFullYear();
        // var FirstDay = new Date(year, month, 1);
        // var LastDay = new Date(year, month + 1, 0);
		// var pre = frappe.datetime.add_days(FirstDay, -6);
		// var nxt = frappe.datetime.add_days(LastDay, -7);
		// from_time_picker.update({
		// 	showSecond: false,
		// 	maxSeconds: 00,
		// 	minDate: frappe.datetime.str_to_obj(pre),
		// 	maxDate: frappe.datetime.str_to_obj(nxt)
		// })
		// var to_time_picker = frm.fields_dict.to_date.datepicker;
		// to_time_picker.update({
		// 	showSecond: false,
		// 	maxSeconds: 00,
		// 	minDate: frappe.datetime.str_to_obj(pre),
		// 	maxDate: frappe.datetime.str_to_obj(nxt)
		// })
        if (frm.is_new()) {
            frm.set_value("status", "Open");
            frm.trigger("calculate_total_days");
        }
        if(frm.doc.is_from_ar){
            frm.add_custom_button(__('Back'), function () {
                frappe.set_route("query-report", "Attendance recapitulation")
            });
        }
    },

    leave_approver: function(frm) {
        if(frm.doc.leave_approver){
            frm.set_value("leave_approver_name", frappe.user.full_name(frm.doc.leave_approver));
        }
    },

    employee: function(frm) {
        frm.trigger("get_leave_balance");
    },

    leave_type: function(frm) {
        frm.trigger("get_leave_balance");
    },

    // half_day: function(frm) {
    //     if (frm.doc.from_date == frm.doc.to_date) {
    //         frm.set_value("half_day_date", frm.doc.from_date);
    //     }
    //     else {
    //         frm.trigger("half_day_datepicker");
    //     }
    //     frm.trigger("calculate_total_days");
    // },

    from_date: function(frm) {
        // frm.trigger("half_day_datepicker");
        frm.trigger("calculate_total_days");
    },
    to_date: function(frm) {
        // frm.trigger("half_day_datepicker");
        frm.trigger("calculate_total_days");
    },
    to_date_session: function(frm){
        frm.trigger("calculate_total_days")
    },
    from_date_session: function(frm){
        frm.trigger("calculate_total_days")
    },
    // half_day_date(frm) {
    //     frm.trigger("calculate_total_days");
    // },

    half_day_datepicker: function(frm) {
        frm.set_value('half_day_date', '');
        var half_day_datepicker = frm.fields_dict.half_day_date.datepicker;
        half_day_datepicker.update({
            minDate: frappe.datetime.str_to_obj(frm.doc.from_date),
            maxDate: frappe.datetime.str_to_obj(frm.doc.to_date)
        })
    },

    get_leave_balance: function(frm) {
        // if(frm.doc.docstatus==0 && frm.doc.employee && frm.doc.leave_type && frm.doc.from_date) {
        if(frm.doc.employee && frm.doc.leave_type && frm.doc.from_date) {
            return frappe.call({
                method: "erpnext.hr.doctype.leave_application.leave_application.get_leave_balance_on",
                args: {
                    employee: frm.doc.employee,
                    date: frm.doc.from_date,
                    leave_type: frm.doc.leave_type,
                    consider_all_leaves_in_the_allocation_period: true
                },
                callback: function(r) {
                    console.log(r.message)
                    if (!r.exc && r.message) {
                        if(Number.isInteger(r.message)){
                            frm.set_value('leave_balance', r.message);
                            frm.set_value('leave_balance1', r.message);
                        } else {
                            var lb = (r.message).toFixed(1);
                            frm.set_value('leave_balance', r.message);
                            frm.set_value('leave_balance1', lb);
                        }
                    }
                }
            });
        }
    },

    calculate_total_days: function(frm) {
        if(frm.doc.from_date && frm.doc.to_date && frm.doc.employee && frm.doc.leave_type) {
            var date_dif = frappe.datetime.get_diff(frm.doc.to_date, frm.doc.from_date) + 1
            return frappe.call({
                method: 'erpnext.hr.doctype.leave_application.leave_application.get_number_of_leave_days',
                args: {
                    "employee": frm.doc.employee,
                    "leave_type": frm.doc.leave_type,
                    "from_date": frm.doc.from_date,
                    "from_date_session":frm.doc.from_date_session,
                    "to_date": frm.doc.to_date,
                    "to_date_session":frm.doc.to_date_session,
                    "date_dif": date_dif
                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value('total_leave_days', r.message);
                        frm.trigger("get_leave_balance");
                    }
                }
            });
        }
    },
    on_submit: function(frm){
        if(frm.doc.status == "Approved"){
            if (frm.doc.leave_type == "Casual Leave"){
                m_status = "CL"
            }else if (frm.doc.leave_type == "Privilege Leave"){
                m_status = "PL"
            }else if (frm.doc.leave_type == "Sick Leave"){
                m_status = "SL"
            }
            frappe.call({
                "method": 'hunter_douglas.update_attendance.update_attendance_by_app',
                args: {
                    "employee": frm.doc.employee,
                    "from_date": frm.doc.from_date,
                    "to_date": frm.doc.to_date,
                    "from_date_session":frm.doc.from_date_session,
                    "to_date_session": frm.doc.to_date_session,
                    "m_status": m_status
                },
                callback: function(r){

                }
            })
        }
    }
});






